"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { requireBoardAdmin } from "@/lib/auth"

export async function createUnit(formData: FormData) {
    await requireBoardAdmin();
    const supabase = await createClient();

    const { error } = await supabase.from("units").insert({
        block: formData.get("block") as string,
        lot: formData.get("lot") as string,
        address_line: formData.get("address_line") as string,
    });

    if (error) throw new Error(error.message);
    revalidatePath("/board/homeowners");
}

export async function assignUnit(formData: FormData) {
    await requireBoardAdmin();
    const supabase = await createClient();

    const { error } = await supabase
    .from("profiles")
    .update({ unit_id: formData.get("unit_id") as string })
    .eq("id", formData.get("profile_id") as string);

    if (error) throw new Error(error.message);
    revalidatePath("/board/homeowners");
}