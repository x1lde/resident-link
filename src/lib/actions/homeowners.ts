"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { requireBoardAdmin } from "@/lib/auth"

export async function createUnit(formData: FormData) {
    // Make sure the user is a board admin before making changes.
    await requireBoardAdmin();
    const supabase = await createClient();

    // Add a new unit using the values from the form.
    const { error } = await supabase.from("units").insert({
        block: formData.get("block") as string,
        lot: formData.get("lot") as string,
        address_line: formData.get("address_line") as string,
    });

    if (error) throw new Error(error.message);

    // Refresh the homeowners page so the new unit appears.
    revalidatePath("/board/homeowners");
}

export async function assignUnit(formData: FormData) {
    // Make sure the user is a board admin before making changes.
    await requireBoardAdmin();
    const supabase = await createClient();

    const { error } = await supabase
    .from("profiles")
    .update({ unit_id: formData.get("unit_id") as string })
    .eq("id", formData.get("profile_id") as string);

    if (error) throw new Error(error.message);

    // Refresh the homeowners page so the updated link appears.
    revalidatePath("/board/homeowners");
}