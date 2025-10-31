import { db } from "./schema";

/**
 * Generic sync function
 * @param tableName - name of the table
 * @param primaryKeys - list of column(s) that make the primary key
 * @param serverRows - array of rows from server (plain objects)
 * @param allColumns - list of all columns in the table
 */
export async function syncTable(
  tableName: string,
  primaryKeys: string[],
  serverRows: any[],
  allColumns: string[]
) {
  try {
    // 1. Fetch local primary keys
    const pkSelect = primaryKeys.join(", ");
    const localRows: any[] = await db.getAllAsync(
      `SELECT ${pkSelect} FROM ${tableName}`
    );

    const localKeySet = new Set(
      localRows.map(r => primaryKeys.map(pk => r[pk]).join("|"))
    );
    const serverKeySet = new Set(
      serverRows.map(r => primaryKeys.map(pk => r[pk]).join("|"))
    );

    // 2. Delete rows that are not on server
    const toDelete = [...localKeySet].filter(k => !serverKeySet.has(k));

    // 3. Build batch queries
    const batch: [string, any[]][] = [];

    // Deletes
    for (const key of toDelete) {
      const parts = key.split("|");
      const whereClause = primaryKeys.map(pk => `${pk} = ?`).join(" AND ");
      batch.push([`DELETE FROM ${tableName} WHERE ${whereClause}`, parts]);
    }

    // Upserts
    const placeholders = allColumns.map(() => "?").join(", ");
    const columnsJoined = allColumns.join(", ");
    const upsertSQL = `INSERT OR REPLACE INTO ${tableName} (${columnsJoined}) VALUES (${placeholders})`;

    for (const row of serverRows) {
      const values = allColumns.map(c => row[c] ?? null);
      batch.push([upsertSQL, values]);
    }

    // 4. Run in a transaction
    await db.execAsync("BEGIN");
    for (const [sql, params] of batch) {
      await db.runAsync(sql, params ?? []); // ✅ ensure params is always an array
    }
    await db.execAsync("COMMIT");

    return {
      success: true,
      deleted: toDelete.length,
      upserted: serverRows.length,
    };
  } catch (error) {
    try {
      await db.execAsync("ROLLBACK");
    } catch (_) {
      // ignore rollback errors
    }
    console.error(`❌ Sync error for table ${tableName}:`, error);
    return { success: false, error };
  }
}

export async function upsertTable(
  tableName: string,
  primaryKeys: string[],
  serverRows: any[],
  allColumns: string[]
) {
  try {
    // Build UPSERT SQL
    const placeholders = allColumns.map(() => "?").join(", ");
    const columnsJoined = allColumns.join(", ");

    // ON CONFLICT(pk1, pk2, ...) DO UPDATE SET col = excluded.col
    const updateAssignments = allColumns
      .filter(c => !primaryKeys.includes(c))
      .map(c => `${c} = excluded.${c}`)
      .join(", ");

    const upsertSQL = `
      INSERT OR REPLACE INTO ${tableName} (${columnsJoined})
      VALUES (${placeholders})
    `;

    // Run batch in transaction
    await db.execAsync("BEGIN");
    for (const row of serverRows) {
      const values = allColumns.map(c => row[c] ?? null);
      await db.runAsync(upsertSQL, values);
    }
    await db.execAsync("COMMIT");

    return {
      success: true,
      upserted: serverRows.length,
    };
  } catch (error) {
    try {
      await db.execAsync("ROLLBACK");
    } catch (_) {
      // ignore rollback errors
    }
    console.error(`❌ Upsert error for table ${tableName}:`, error);
    return { success: false, error };
  }
}
