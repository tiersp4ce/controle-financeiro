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
