"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { requireBoardAdmin } from "@/lib/auth";

// Server actions for homeowners management (create/assign units).
// Creates a new property unit (block/lot) record.
export async function createUnit(formData: FormData) {
    // ensure the caller has board admin privileges
    await requireBoardAdmin();

    const supabase = await createClient();
    const block = (formData.get("block") as string)?.trim();
    const lot = (formData.get("lot") as string)?.trim();
    const addressLine = (formData.get("address_line") as string)?.trim();

    // 2. Validate required unit identifiers
    if (!block || !lot) {
        throw new Error("Both Block and Lot identifiers are required fields.");
    }

    // 4. Save the unit record into the database
    const { error } = await supabase.from("units").insert({
        block,
        lot,
        address_line: addressLine || null,
    });

    if (error) {
        throw new Error(`Failed to create unit: ${error.message}`);
    }

    // 5. Instantly invalidate rendering layout view dashboard cache states
    revalidatePath("/board/homeowners");
}

// Link a registered homeowner profile to a unit.
export async function assignUnit(formData: FormData) {
    // ensure caller is an admin
    await requireBoardAdmin();

    const supabase = await createClient();
    const unitId = formData.get("unit_id") as string;
    const profileId = formData.get("profile_id") as string;

    // 2. Ensure vital matching configuration attributes are supplied
    if (!unitId || !profileId) {
        throw new Error("Missing vital matching parameters: unit_id or profile_id.");
    }

    // 3. Update profile row to bridge relational account assignments
    // 3. Link the homeowner profile to the selected unit
    const { error } = await supabase
        .from("profiles")
        .update({ unit_id: unitId })
        .eq("id", profileId);

    if (error) {
        throw new Error(`Failed to assign unit link: ${error.message}`);
    }

    // 4. Instantly invalidate rendering layout view dashboard cache states
    revalidatePath("/board/homeowners");
}
