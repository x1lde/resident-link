"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { requireBoardAdmin } from "@/lib/auth";

export async function createDuesCharges(formData: FormData) {
    // Make sure the user is a board admin.
    await requireBoardAdmin();

    const supabase = await createClient();
    const amount = Number(formData.get("amount"));

    // Make sure the amount is a positive number.
    if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid billing amount. Must be greater than zero.");
    }

    // Add a new dues charge to the database.
    const { error } = await supabase.from("dues_charges").insert({
        unit_id: formData.get("unit_id") as string,
        description: formData.get("description") as string,
        amount: amount,
        due_date: formData.get("due_date") as string,
    });

    if (error) throw new Error(error.message);

    // Refresh the dues page so it shows the new charge.
    revalidatePath("/board/dues");
}

export async function recordDuesPayment(formData: FormData) {
    // Make sure the user is a board admin.
    await requireBoardAdmin();

    const supabase = await createClient();
    const chargeId = formData.get("charge_id") as string;
    const paymentAmount = Number(formData.get("amount"));

    // Make sure the payment amount is valid.
    if (!chargeId) throw new Error("Missing target charge ID.");
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        throw new Error("Invalid payment amount.");
    }

    // Record the payment made for a dues charge.
    const { error: paymentError } = await supabase.from("dues_payments").insert({
        charge_id: chargeId,
        amount: paymentAmount,
        method: formData.get("method") as string,
    });

    if (paymentError) throw new Error(paymentError.message);

    // Get the original charge amount so we can check if it is fully paid.
    const { data: charge, error: fetchError } = await supabase
        .from("dues_charges")
        .select("amount")
        .eq("id", chargeId)
        .single();

    if (fetchError || !charge) throw new Error("Could not retrieve the charge details.");

    // Get previous payments for this charge.
    const { data: pastPayments } = await supabase
        .from("dues_payments")
        .select("amount")
        .eq("charge_id", chargeId);

    const totalPaidSoFar = (pastPayments ?? []).reduce((sum, current) => sum + current.amount, 0);

    // Mark the charge paid only when all payments cover the amount.
    if (totalPaidSoFar >= charge.amount) {
        const { error: statusError } = await supabase
            .from("dues_charges")
            .update({ status: "paid" })
            .eq("id", chargeId);
            
        if (statusError) throw new Error(statusError.message);
    } else {
        // If not fully paid, mark the charge as partially paid.
        await supabase
            .from("dues_charges")
            .update({ status: "partially_paid" })
            .eq("id", chargeId);
    }

    // Refresh the dues page so it shows the latest payment status.
    revalidatePath("/board/dues");
}
