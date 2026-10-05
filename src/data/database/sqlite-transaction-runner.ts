import { ITransactionRunner } from "../../domain/repositories/transaction-runner";
import { getDatabase } from "./sqlite-connection";

export class SqliteTransactionRunner implements ITransactionRunner {
  async runTransaction<T>(work: () => Promise<T>): Promise<T> {
    const db = await getDatabase();
    if (!db) {
      return await work();
    }

    let result: T;
    await db.withTransactionAsync(async () => {
      result = await work();
    });
    return result!;
  }
}
