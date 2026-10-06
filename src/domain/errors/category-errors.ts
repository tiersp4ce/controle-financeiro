export class CategoryInUseByRecurringError extends Error {
  constructor(
    public readonly recurringCount: number,
    message?: string
  ) {
    super(
      message ||
        `A categoria está vinculada a ${recurringCount} regra(s) de recorrência ativa(s).`
    );
    this.name = 'CategoryInUseByRecurringError';
    Object.setPrototypeOf(this, CategoryInUseByRecurringError.prototype);
  }
}

/**
 * Erro disparado quando o usuário tenta excluir uma categoria que ainda possui
 * transações financeiras ativas vinculadas a ela.
 */
export class CategoryInUseByTransactionsError extends Error {
  constructor(
    public readonly transactionCount: number,
    message?: string
  ) {
    super(
      message ||
        `A categoria está vinculada a ${transactionCount} transação(ões) ativa(s).`
    );
    this.name = 'CategoryInUseByTransactionsError';
    Object.setPrototypeOf(this, CategoryInUseByTransactionsError.prototype);
  }
}

