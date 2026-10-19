/**
 * @file useProductStore.ts
 * @description Gerenciamento de estado global reativo da aplicação com Zustand.
 * Centraliza o catálogo de produtos, filtros ativos, ordenação e estado de paginação,
 * utilizando seletores calculados para derivação em tempo de execução sem redundância.
 */

import { create } from 'zustand';
import {
  Product,
  CreateProductInput,
  ProductCategory,
  ProductFilterCriteria,
  SortOption,
} from '@/types/product';
import { productService, IProductService } from '@/services/productService';

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductStoreState {
  // Estado dos Dados
  products: Product[];
  isLoading: boolean;
  error: string | null;

  // Critérios de Filtragem e Ordenação
  filterCriteria: ProductFilterCriteria;

  // Paginação
  currentPage: number;
  pageSize: number;

  // Ações de Carregamento e Mutação
  fetchProducts: () => Promise<void>;
  addProduct: (input: CreateProductInput) => Promise<Product>;

  // Ações de Filtro e Busca
  setSearchQuery: (query: string) => void;
  setCategory: (category: ProductCategory | 'ALL') => void;
  setPriceRange: (min?: number | null, max?: number | null) => void;
  setSort: (sort: SortOption) => void;
  resetFilters: () => void;

  // Ações de Paginação
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

const INITIAL_FILTERS: ProductFilterCriteria = {
  searchQuery: '',
  category: 'ALL',
  minPrice: null,
  maxPrice: null,
  sort: 'name-asc',
};

const DEFAULT_PAGE_SIZE = 6;

/**
 * Hook de Estado Global Zustand para o Catálogo de Produtos.
 * Utiliza o padrão de store com injeção de dependência opcional para viabilizar testes unitários.
 */
export const createProductStore = (service: IProductService = productService) =>
  create<ProductStoreState>()((set) => ({
    // Estado inicial
    products: [],
    isLoading: false,
    error: null,
    filterCriteria: { ...INITIAL_FILTERS },
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,

    // Ação assíncrona: Carregar produtos do serviço
    fetchProducts: async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await service.fetchProducts();
        set({
          products: data,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar catálogo de produtos';
        set({
          isLoading: false,
          error: message,
        });
      }
    },

    // Ação assíncrona: Cadastrar novo produto e refletir imediatamente
    addProduct: async (input: CreateProductInput): Promise<Product> => {
      set({ isLoading: true, error: null });
      try {
        const createdProduct = await service.createProduct(input);
        // Atualização atômica e imutável no topo da lista
        set((state) => ({
          products: [createdProduct, ...state.products],
          isLoading: false,
          // Mantém a paginação na primeira página para visualização imediata do novo item
          currentPage: 1,
        }));
        return createdProduct;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao cadastrar produto';
        set({ isLoading: false, error: message });
        throw err;
      }
    },

    // Ações de atualização de filtros (resetam a página atual para 1 para evitar estados de página vazia)
    setSearchQuery: (searchQuery: string) => {
      set((state) => ({
        filterCriteria: { ...state.filterCriteria, searchQuery },
        currentPage: 1,
      }));
    },

    setCategory: (category: ProductCategory | 'ALL') => {
      set((state) => ({
        filterCriteria: { ...state.filterCriteria, category },
        currentPage: 1,
      }));
    },

    setPriceRange: (min?: number | null, max?: number | null) => {
      set((state) => ({
        filterCriteria: {
          ...state.filterCriteria,
          minPrice: min ?? null,
          maxPrice: max ?? null,
        },
        currentPage: 1,
      }));
    },

    setSort: (sort: SortOption) => {
      set((state) => ({
        filterCriteria: { ...state.filterCriteria, sort },
        currentPage: 1,
      }));
    },

    resetFilters: () => {
      set({
        filterCriteria: { ...INITIAL_FILTERS },
        currentPage: 1,
      });
    },

    // Ações de Paginação
    setCurrentPage: (currentPage: number) => {
      set({ currentPage: Math.max(1, currentPage) });
    },

    setPageSize: (pageSize: number) => {
      set({
        pageSize: Math.max(1, pageSize),
        currentPage: 1,
      });
    },
  }));

/**
 * Instância singleton da store global para consumo em componentes da aplicação.
 */
export const useProductStore = createProductStore();

/* =========================================================================
   SELETORES COMPUTADOS (DERIVED SELECTORS)
   Evitam redundância no estado base e calculam dados derivados sob demanda.
   ========================================================================= */

/**
 * Seletor que deriva a lista completa de produtos filtrados e ordenados.
 * Reutiliza a lógica pura de filtragem desacoplada do productService.
 */
export const selectFilteredProducts = (state: ProductStoreState): Product[] => {
  return productService.filterAndSort(state.products, state.filterCriteria);
};

/**
 * Seletor que fatia os produtos filtrados correspondentes à página atual.
 */
export const selectPaginatedProducts = (state: ProductStoreState): Product[] => {
  const filtered = selectFilteredProducts(state);
  const startIndex = (state.currentPage - 1) * state.pageSize;
  return filtered.slice(startIndex, startIndex + state.pageSize);
};

/**
 * Seletor que calcula informações de paginação derivadas (total de páginas, contagens, etc.).
 */
export const selectPaginationInfo = (state: ProductStoreState): PaginationInfo => {
  const totalItems = selectFilteredProducts(state).length;
  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  const currentPage = Math.min(state.currentPage, totalPages);

  return {
    currentPage,
    pageSize: state.pageSize,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * Seletor que computa limites de preço (menor e maior valor) a partir de todo o acervo.
 * Útil para configurar limites visuais de inputs e sliders.
 */
export const selectPriceRangeBounds = (state: ProductStoreState): { min: number; max: number } => {
  if (state.products.length === 0) {
    return { min: 0, max: 10000 };
  }
  const prices = state.products.map((p) => p.price);
  return {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  };
};

/**
 * Seletor para listar todas as categorias únicas atualmente disponíveis no catálogo.
 */
export const selectAvailableCategories = (state: ProductStoreState): ProductCategory[] => {
  const categoriesSet = new Set<ProductCategory>();
  state.products.forEach((p) => categoriesSet.add(p.category));
  return Array.from(categoriesSet);
};
