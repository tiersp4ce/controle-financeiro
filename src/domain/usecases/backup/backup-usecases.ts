import { IBackupRepository } from '../../repositories/backup.repository';
import { ICategoryRepository } from '../../repositories/category.repository';
import { ITransactionRepository } from '../../repositories/transaction.repository';
import { IRecurringTransactionRepository } from '../../repositories/recurring-transaction.repository';
import { ISettingsRepository } from '../../repositories/settings.repository';
import { ITransactionRunner } from '../../repositories/transaction-runner';
import { BackupData } from '../../entities/backup';
import { PaymentMethod, TransactionType } from '../../enums';

export class ExportBackupJsonUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly backupRepository: IBackupRepository,
    private readonly settingsRepository?: ISettingsRepository,
    private readonly recurringRepository?: IRecurringTransactionRepository
  ) {}

  async execute(): Promise<string> {
    const transactions = await this.transactionRepository.findAll();
    const categories = await this.categoryRepository.findAll();
    const recurringTransactions = this.recurringRepository
      ? await this.recurringRepository.findAll()
      : [];
    const salaryConfig = this.settingsRepository
      ? await this.settingsRepository.getSalaryConfig()
      : null;
    const creditCardConfig = this.settingsRepository
      ? await this.settingsRepository.getCreditCardConfig()
      : null;

    const backupData: BackupData = {
      version: 5,
      exportedAt: new Date().toISOString(),
      categories,
      transactions,
      salaryConfig,
      creditCardConfig,
      recurringTransactions,
    };

    return this.backupRepository.exportToFile(backupData);
  }
}

export class ImportBackupJsonUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly backupRepository: IBackupRepository,
    private readonly settingsRepository?: ISettingsRepository,
    private readonly recurringRepository?: IRecurringTransactionRepository,
    private readonly transactionRunner?: ITransactionRunner
  ) {}

  private validateBackupData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Formato do arquivo de backup inválido: dados vazios ou não são um objeto.');
    }

    if (
      typeof data.version !== 'number' ||
      !Number.isInteger(data.version) ||
      data.version < 1
    ) {
      throw new Error('Versão do backup inválida ou não suportada.');
    }

    if (!Array.isArray(data.categories)) {
      throw new Error('Formato de categorias inválido no backup: esperava-se um array.');
    }

    for (const cat of data.categories) {
      if (!cat || typeof cat !== 'object') {
        throw new Error('Categoria inválida no backup: item não é um objeto.');
      }
      if (typeof cat.id !== 'string' || cat.id.trim().length === 0) {
        throw new Error('Categoria inválida no backup: id ausente ou em formato incorreto.');
      }
      if (typeof cat.name !== 'string' || cat.name.trim().length === 0) {
        throw new Error(`Categoria inválida no backup (ID: ${cat.id}): o campo "name" não pode ser vazio.`);
      }
      const hasColor = typeof cat.colorHex === 'string' || typeof cat.color === 'string';
      const hasIcon = typeof cat.iconKey === 'string' || typeof cat.icon === 'string';
      if (!hasColor) {
        throw new Error(`Categoria inválida no backup (ID: ${cat.id}): cor ausente.`);
      }
      if (!hasIcon) {
        throw new Error(`Categoria inválida no backup (ID: ${cat.id}): ícone ausente.`);
      }
    }

    if (!Array.isArray(data.transactions)) {
      throw new Error('Formato de transações inválido no backup: esperava-se um array.');
    }

    const validTypes = Object.values(TransactionType) as string[];
    const validPaymentMethods = Object.values(PaymentMethod) as string[];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const tx of data.transactions) {
      if (!tx || typeof tx !== 'object') {
        throw new Error('Transação inválida no backup: item não é um objeto.');
      }
      if (typeof tx.id !== 'string' || tx.id.trim().length === 0) {
        throw new Error('Transação inválida no backup: id ausente ou em formato incorreto.');
      }
      if (
        typeof tx.amountCents !== 'number' ||
        !Number.isInteger(tx.amountCents) ||
        tx.amountCents <= 0
      ) {
        throw new Error(
          `Transação inválida no backup (ID: ${tx.id}): "amountCents" deve ser um inteiro positivo > 0.`
        );
      }
      if (!validTypes.includes(tx.type)) {
        throw new Error(
          `Transação inválida no backup (ID: ${tx.id}): "type" inválido (${tx.type}).`
        );
      }
      if (!validPaymentMethods.includes(tx.paymentMethod)) {
        throw new Error(
          `Transação inválida no backup (ID: ${tx.id}): "paymentMethod" inválido (${tx.paymentMethod}).`
        );
      }
      if (typeof tx.date !== 'string' || !dateRegex.test(tx.date) || isNaN(new Date(tx.date).getTime())) {
        throw new Error(
          `Transação inválida no backup (ID: ${tx.id}): "date" deve estar no formato ISO YYYY-MM-DD válido.`
        );
      }
    }

    if (data.recurringTransactions !== undefined && data.recurringTransactions !== null) {
      if (!Array.isArray(data.recurringTransactions)) {
        throw new Error('Formato de transações recorrentes inválido no backup: esperava-se um array.');
      }

      for (const rec of data.recurringTransactions) {
        if (!rec || typeof rec !== 'object') {
          throw new Error('Transação recorrente inválida no backup: item não é um objeto.');
        }
        if (typeof rec.id !== 'string' || rec.id.trim().length === 0) {
          throw new Error('Transação recorrente inválida no backup: id ausente.');
        }
        if (typeof rec.description !== 'string') {
          throw new Error(`Transação recorrente inválida no backup (ID: ${rec.id}): descrição ausente.`);
        }
        if (
          typeof rec.amountCents !== 'number' ||
          !Number.isInteger(rec.amountCents) ||
          rec.amountCents <= 0
        ) {
          throw new Error(
            `Transação recorrente inválida no backup (ID: ${rec.id}): "amountCents" deve ser um inteiro positivo > 0.`
          );
        }
        if (
          typeof rec.dayOfMonth !== 'number' ||
          !Number.isInteger(rec.dayOfMonth) ||
          rec.dayOfMonth < 1 ||
          rec.dayOfMonth > 31
        ) {
          throw new Error(
            `Transação recorrente inválida no backup (ID: ${rec.id}): "dayOfMonth" deve ser um número inteiro entre 1 e 31.`
          );
        }
        if (!validTypes.includes(rec.type)) {
          throw new Error(
            `Transação recorrente inválida no backup (ID: ${rec.id}): "type" inválido (${rec.type}).`
          );
        }
        if (!validPaymentMethods.includes(rec.paymentMethod)) {
          throw new Error(
            `Transação recorrente inválida no backup (ID: ${rec.id}): "paymentMethod" inválido (${rec.paymentMethod}).`
          );
        }
        if (typeof rec.startDate !== 'string' || !dateRegex.test(rec.startDate)) {
          throw new Error(
            `Transação recorrente inválida no backup (ID: ${rec.id}): "startDate" deve estar no formato ISO YYYY-MM-DD.`
          );
        }
      }
    }
  }

  async execute(): Promise<{
    transactionCount: number;
    categoryCount: number;
    recurringCount: number;
    hasSalaryConfig: boolean;
    hasCreditCardConfig: boolean;
  }> {
    const data = await this.backupRepository.importFromFile();
    if (!data) {
      throw new Error('Operação de importação cancelada ou arquivo inválido.');
    }

    this.validateBackupData(data);

    const performRestore = async () => {
      await this.transactionRepository.deleteAll();
      await this.categoryRepository.deleteAll();
      if (this.recurringRepository) {
        await this.recurringRepository.deleteAll();
      }

      await this.categoryRepository.createMany(data.categories);
      await this.transactionRepository.createMany(data.transactions);

      let recurringCount = 0;
      if (this.recurringRepository && Array.isArray(data.recurringTransactions)) {
        await this.recurringRepository.createMany(data.recurringTransactions);
        recurringCount = data.recurringTransactions.length;
      }

      let hasSalaryConfig = false;
      if (data.salaryConfig && this.settingsRepository) {
        await this.settingsRepository.saveSalaryConfig(data.salaryConfig);
        hasSalaryConfig = true;
      }

      let hasCreditCardConfig = false;
      if (data.creditCardConfig && this.settingsRepository) {
        await this.settingsRepository.saveCreditCardConfig(data.creditCardConfig);
        hasCreditCardConfig = true;
      }

      return {
        transactionCount: data.transactions.length,
        categoryCount: data.categories.length,
        recurringCount,
        hasSalaryConfig,
        hasCreditCardConfig,
      };
    };

    if (this.transactionRunner) {
      return await this.transactionRunner.runTransaction(performRestore);
    }
    return await performRestore();
  }
}
