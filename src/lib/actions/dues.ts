"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { requireBoardAdmin } from "@/lib/auth"

export async function createDuesCharges(formData: FormData) {
    // Make sure the user is a board admin before making changes.
    await requireBoardAdmin();

    const supabase = await createClient();

    // Add a new dues charge to the database.
    const { error } = await supabase.from("dues_charges").insert({
        unit_id: formData.get("unit_id") as string,
        description: formData.get("description") as string,
        amount: Number(formData.get("amount")),
        due_data: formData.get("due_date") as string,
    });

    if (error) throw new Error(error.message);

    // Refresh the dues page after the charge is created.
    revalidatePath("/board/dues");
}

export async function recordDuesPayment(formData: FormData) {
    // Make sure the user is a board admin before making changes.
    await requireBoardAdmin();

    const supabase = await createClient();
    const chargeId = formData.get("charge_id") as string;

    // Record the payment made for a dues charge.
    const { error: paymentError } = await supabase.from("dues_payments").insert({
        charge_id: chargeId,
        amount: Number(formData.get("amount")),
        method: formData.get("method") as string,
    });

    if (paymentError) throw new Error(paymentError.message);

    // Mark the associated dues charge as paid.
    const { error: statusError } = await supabase
        .from("dues_charges")
        .update({ status: "paid" })
        .eq("id", chargeId);
    if (statusError) throw new Error(statusError.message);
}