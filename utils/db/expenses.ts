import { EventExpense } from "@/types/model";
import { queueDB } from "./DatabaseQueue";
import { db } from "./schema";
import { syncTable, upsertTable } from "./SyncDB";

// ✅ Get all expenses for an event
export async function getEventExpenses(event_id: string): Promise<EventExpense[]> {
  try {
    const expenses = await db.getAllAsync<any>(`
      SELECT 
        e.expense_id,
        e.event_id,
        e.amount,
        e.description,
        e.uploaded_by,
        e.uploaded_at,
        u.user_id as u_user_id,
        u.name as u_name,
        u.email as u_email
      FROM event_expenses e
      LEFT JOIN users u ON e.uploaded_by = u.user_id
      WHERE e.event_id = ?
      ORDER BY e.uploaded_at DESC
    `, [event_id]);

    return expenses.map(exp => ({
      expense_id: exp.expense_id,
      event_id: exp.event_id,
      amount: exp.amount,
      description: exp.description,
      uploaded_by: exp.uploaded_by,
      uploaded_at: exp.uploaded_at,
      uploaded_by_user: exp.u_user_id ? {
        user_id: exp.u_user_id,
        name: exp.u_name,
        email: exp.u_email,
      } as any : null,
    }));
  } catch (error) {
    console.error("Error getting event expenses:", error);
    return [];
  }
}

// ✅ Insert expense
export async function insertExpense(expense: EventExpense) {
  try {
    await db.runAsync(
      `INSERT INTO event_expenses (
        expense_id,
        event_id,
        amount,
        description,
        uploaded_by,
        uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        expense.expense_id,
        expense.event_id,
        expense.amount,
        expense.description,
        expense.uploaded_by,
        expense.uploaded_at,
      ]
    );
    return { success: true };
  } catch (error) {
    console.error("Error inserting expense:", error);
    return { success: false, error };
  }
}

// ✅ Update expense
export async function updateExpense(expense_id: string, amount: number, description: string | null) {
  try {
    await db.runAsync(
      `UPDATE event_expenses 
       SET amount = ?, description = ? 
       WHERE expense_id = ?`,
      [amount, description, expense_id]
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, error };
  }
}

// ✅ Delete expense
export async function deleteExpense(expense_id: string) {
  try {
    await db.runAsync(`DELETE FROM event_expenses WHERE expense_id = ?`, [expense_id]);
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error };
  }
}

// ✅ Sync expenses from server
export async function syncExpenses(expenses: unknown) {
    try {
      // ✅ Ensure we always work with an array
      if (!Array.isArray(expenses)) {
        console.error("syncExpenses expected array, got:", expenses);
        return { success: false, error: "Invalid expenses payload" };
      }
  
      // ✅ Remove invalid rows (prevents NOT NULL crash)
      const validExpenses = expenses.filter(
        (e): e is EventExpense =>
          !!e &&
          typeof e === "object" &&
          !!e.expense_id &&
          !!e.event_id &&
          typeof e.amount === "number"
      );
  
      if (validExpenses.length === 0) {
        console.warn("No valid expenses to sync");
        return { success: true };
      }
  
      await queueDB(() =>
        syncTable(
          "event_expenses",
          ["expense_id"],
          validExpenses,
          ["expense_id", "event_id", "amount", "description", "uploaded_by", "uploaded_at"]
        )
      );
  
      // ✅ Sync users safely
      for (const expense of validExpenses) {
        if (expense.uploaded_by_user?.user_id) {
          await queueDB(() =>
            upsertTable(
              "users",
              ["user_id"],
              [expense.uploaded_by_user],
              ["user_id", "name", "email"]
            )
          );
        }
      }
  
      return { success: true };
    } catch (error) {
      console.error("Error syncing expenses:", error);
      return { success: false, error };
    }
  }
  

