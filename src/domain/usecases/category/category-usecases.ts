import { ICategoryRepository } from '../../repositories/category.repository';
import { IRecurringTransactionRepository } from '../../repositories/recurring-transaction.repository';
import { Category } from '../../entities/category';
import { CategoryInUseByRecurringError } from '../../errors/category-errors';

export interface DeleteCategoryOptions {
  forceCascade?: boolean;
}

export class GetCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}
  async execute(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }
}

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}
  async execute(name: string, iconKey: string, colorHex: string): Promise<Category> {
    const category: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      iconKey,
      colorHex,
      isDefault: false,
    };
    await this.categoryRepository.create(category);
    return category;
  }
}

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}
  async execute(category: Category): Promise<void> {
    await this.categoryRepository.update(category);
  }
}

export class DeleteCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly recurringRepository?: IRecurringTransactionRepository
  ) {}

  async execute(id: string, options?: DeleteCategoryOptions): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) return;
    if (category.isDefault) {
      throw new Error('Categorias padrão do sistema não podem ser excluídas.');
    }

    if (this.recurringRepository) {
      const activeRecurringCount = await this.recurringRepository.countByCategoryId(id);
      if (activeRecurringCount > 0 && !options?.forceCascade) {
        throw new CategoryInUseByRecurringError(
          activeRecurringCount,
          `A categoria "${category.name}" está vinculada a ${activeRecurringCount} regra(s) recorrente(s) ativa(s).`
        );
      }
    }

    await this.categoryRepository.delete(id);
  }
}

export class SeedDefaultCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(): Promise<void> {
    const count = await this.categoryRepository.count();
    if (count > 0) return;

    const defaults: Category[] = [
      { id: 'cat_alimentacao', name: 'Alimentação', iconKey: 'fast-food', colorHex: '#FF7043', isDefault: true },
      { id: 'cat_moradia', name: 'Moradia', iconKey: 'home', colorHex: '#42A5F5', isDefault: true },
      { id: 'cat_transporte', name: 'Transporte', iconKey: 'car', colorHex: '#AB47BC', isDefault: true },
      { id: 'cat_lazer', name: 'Lazer', iconKey: 'game-controller', colorHex: '#26A69A', isDefault: true },
      { id: 'cat_saude', name: 'Saúde', iconKey: 'medkit', colorHex: '#EF5350', isDefault: true },
      { id: 'cat_salario', name: 'Salário', iconKey: 'cash', colorHex: '#66BB6A', isDefault: true },
      { id: 'cat_investimentos', name: 'Investimentos', iconKey: 'trending-up', colorHex: '#FFA726', isDefault: true },
      { id: 'cat_outros', name: 'Outros', iconKey: 'apps', colorHex: '#78909C', isDefault: true },
    ];

    await this.categoryRepository.createMany(defaults);
  }
}
