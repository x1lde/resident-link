"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { requireBoardAdmin } from "@/lib/auth";

// Creates a new property unit (block/lot) record.
export async function createUnit(formData: FormData) {
    // require admin access before making changes
    await requireBoardAdmin();

    const supabase = await createClient();
    const block = (formData.get("block") as string)?.trim();
    const lot = (formData.get("lot") as string)?.trim();
    const addressLine = (formData.get("address_line") as string)?.trim();

    // block and lot are required identifiers for a new unit
    if (!block || !lot) {
        throw new Error("Both Block and Lot identifiers are required fields.");
    }

    // insert the new unit record into the database
    const { error } = await supabase.from("units").insert({
        block,
        lot,
        address_line: addressLine || null,
    });

    if (error) {
        throw new Error(`Failed to create unit: ${error.message}`);
    }

    // refresh the homeowners dashboard after creation
    revalidatePath("/board/homeowners");
}

// Links an existing homeowner profile to a unit.
export async function assignUnit(formData: FormData) {
    // require admin access before modifying profiles
    await requireBoardAdmin();

    const supabase = await createClient();
    const unitId = formData.get("unit_id") as string;
    const profileId = formData.get("profile_id") as string;

    // ensure both the unit and profile are provided
    if (!unitId || !profileId) {
        throw new Error("Missing vital matching parameters: unit_id or profile_id.");
    }

    // update the profile to link it to the selected unit
    const { error } = await supabase
        .from("profiles")
        .update({ unit_id: unitId })
        .eq("id", profileId);

    if (error) {
        throw new Error(`Failed to assign unit link: ${error.message}`);
    }

    // refresh the homeowners dashboard after assignment
    revalidatePath("/board/homeowners");
}
