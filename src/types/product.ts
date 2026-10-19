/**
 * @file product.ts
 * @description Definições de tipos e interfaces estritas para o domínio de Produtos da Suzano Papel e Celulose.
 * Segue padrões corporativos e princípios DDD (Domain-Driven Design).
 */

export type ProductCategory =
  | 'Celulose'
  | 'Papéis de Imprimir e Escrever'
  | 'Embalagens e Papelcartão'
  | 'Bens de Consumo / Tissue'
  | 'Bioprodutos e Inovação';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  imageUrl: string;
  sku?: string;
  inStock?: boolean;
  unit?: string;
  createdAt?: string;
}

export type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc';

export interface ProductFilterCriteria {
  searchQuery: string;
  category?: ProductCategory | 'ALL';
  minPrice?: number | null;
  maxPrice?: number | null;
  sort: SortOption;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type CreateProductInput = Omit<Product, 'id' | 'createdAt'>;

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}
