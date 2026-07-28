"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { requireBoardAdmin } from "@/lib/auth";

/**
 * Server actions for dues charge creation and payment recording.
 */

/**
 * Creates a new dues billing charge for a specific property unit.
 */
export async function createDuesCharges(formData: FormData) {
    // enforce authorization before any data operations
    await requireBoardAdmin();

    const supabase = await createClient();
    const amount = Number(formData.get("amount"));

    // validate the amount before inserting
    if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid billing amount. Must be greater than zero.");
    }

    const { error } = await supabase.from("dues_charges").insert({
        unit_id: formData.get("unit_id") as string,
        description: formData.get("description") as string,
        amount,
        due_date: formData.get("due_date") as string,
    });

    if (error) {
        throw new Error(`Failed to create charge: ${error.message}`);
    }

    // refresh the dues page so updated charges appear immediately
    revalidatePath("/board/dues");
}

/**
 * Logs a payment and updates the associated charge status.
 */
export async function recordDuesPayment(formData: FormData) {
    // enforce authorization before any modifications
    await requireBoardAdmin();

    const supabase = await createClient();
    const chargeId = formData.get("charge_id") as string;
    const paymentAmount = Number(formData.get("amount"));

    if (!chargeId) {
        throw new Error("Missing targeted charge reference ID.");
    }

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new Error("Invalid payment registration amount.");
    }

    const { error: paymentError } = await supabase.from("dues_payments").insert({
        charge_id: chargeId,
        amount: paymentAmount,
        method: formData.get("method") as string,
    });

    if (paymentError) {
        throw new Error(`Failed to save payment: ${paymentError.message}`);
    }

    const { data: charge, error: fetchError } = await supabase
        .from("dues_charges")
        .select(`
            amount,
            dues_payments ( amount )
        `)
        .eq("id", chargeId)
        .single();

    if (fetchError || !charge) {
        throw new Error("Could not retrieve charge parameters for matching calculations.");
    }

    const history = (charge.dues_payments as { amount: number }[]) || [];
    const totalPaid = history.reduce((sum, payment) => sum + payment.amount, 0);
    const finalStatus = totalPaid >= charge.amount ? "paid" : "partially_paid";

    const { error: statusError } = await supabase
        .from("dues_charges")
        .update({ status: finalStatus })
        .eq("id", chargeId);

    if (statusError) {
        throw new Error(`Failed to update status: ${statusError.message}`);
    }

    // refresh the dues page after payment and status changes
    revalidatePath("/board/dues");
}
