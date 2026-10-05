export interface ITransactionRunner {
  runTransaction<T>(work: () => Promise<T>): Promise<T>;
}
