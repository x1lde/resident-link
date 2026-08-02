"use server";

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/client"
import { requireBoardAdmin } from "../auth";

export async function createBudgetCategory(budget: { name: string; amount: number }) { 
    // Define an asynchronous function to create a new budget category, accepting an object with name and amount properties.
    await requireBoardAdmin(); 
    const supabase = createClient();

    const name = budget.name.trim(); // Trim whitespace from the name to ensure it's not empty or just spaces.
    if (!name) throw new Error("Budget category name is required."); // Check if the name is empty after trimming.
    if (budget.amount <= 0) throw new Error("Budget category amount must be greater than zero."); // Validate that the amount is greater than zero.

    const { error } = await supabase.from("budget_categories").insert({ // Insert a new record into the budget_categories table in the database.
        name, // Insert the trimmed name into the budget_categories table.
        amount: budget.amount, // Insert the validated amount into the budget_categories table.
        fiscal_year: new Date().getFullYear(), // Set the fiscal year to the current year.
    });
    if (error) throw new Error(`Failed to create budget category: ${error.message}`); // If there's an error during insertion, throw an error with the message.
    revalidatePath("/board/budget"); 
}

export async function createBudgetTransaction(transaction: { category_id: number; amount: number; description: string }) {
    // Define an asynchronous function to create a new budget transaction, accepting an object with category_id, amount, and description properties.
    await requireBoardAdmin();
    const supabase = createClient();

    const amount = transaction.amount; // Store the transaction amount in a variable for validation.
    if (amount <= 0) throw new Error("Budget transaction amount must be greater than zero."); // Validate that the transaction amount is greater than zero.
    if (!transaction.description.trim()) throw new Error("Budget transaction description is required."); // Validate that the transaction description is not empty or just whitespace.

    const { error } = await supabase.from("budget_transactions").insert({ // Insert a new record into the budget_transactions table in the database.
        category_id: transaction.category_id, // Insert the category_id into the budget_transactions table.
        amount: transaction.amount, // Insert the validated amount into the budget_transactions table.
        description: transaction.description, // Insert the validated description into the budget_transactions table.
        occurred_at: new Date(), // Set the occurred_at field to the current date and time.
    });
    if (error) throw new Error(`Failed to create budget transaction: ${error.message}`);
    revalidatePath("/board/budget");
    revalidatePath("/resident/budget");
}