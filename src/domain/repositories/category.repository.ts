import { Category } from '../entities/category';

export interface ICategoryRepository {
  create(category: Category): Promise<void>;
  createMany(categories: Category[]): Promise<void>;
  update(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  count(): Promise<number>;
  deleteAll(): Promise<void>;
}
