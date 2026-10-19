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
  updateProduct: (id: string, updates: Partial<CreateProductInput>) => Promise<Product>;

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

    // Ação assíncrona: Atualizar produto existente
    updateProduct: async (id: string, updates: Partial<CreateProductInput>): Promise<Product> => {
      set({ isLoading: true, error: null });
      try {
        const updated = await service.updateProduct(id, updates);
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? updated : p)),
          isLoading: false,
        }));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar produto';
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
   SELETORES COMPUTADOS COM CACHE REFERENCIAL (MEMOIZED DERIVED SELECTORS)
   Evitam redundância no estado base e garantem estabilidade de referência de
   memória para o useSyncExternalStore / getServerSnapshot do React 19 e SSR.
   ========================================================================= */

let lastFilteredProductsInput: Product[] | null = null;
let lastFilteredCriteriaInput: ProductFilterCriteria | null = null;
let cachedFilteredProducts: Product[] = [];

/**
 * Seletor que deriva a lista completa de produtos filtrados e ordenados.
 * Utiliza cache referencial para retornar a mesma referência quando os dados não mudarem.
 */
export const selectFilteredProducts = (state: ProductStoreState): Product[] => {
  if (
    state.products === lastFilteredProductsInput &&
    state.filterCriteria === lastFilteredCriteriaInput
  ) {
    return cachedFilteredProducts;
  }

  lastFilteredProductsInput = state.products;
  lastFilteredCriteriaInput = state.filterCriteria;
  cachedFilteredProducts = productService.filterAndSort(state.products, state.filterCriteria);
  return cachedFilteredProducts;
};

let lastPaginatedSource: Product[] | null = null;
let lastPaginatedPage: number | null = null;
let lastPaginatedSize: number | null = null;
let cachedPaginatedProducts: Product[] = [];

/**
 * Seletor que fatia os produtos filtrados correspondentes à página atual.
 * Cacheia o array resultante para evitar loops de renderização no getServerSnapshot.
 */
export const selectPaginatedProducts = (state: ProductStoreState): Product[] => {
  const filtered = selectFilteredProducts(state);

  if (
    filtered === lastPaginatedSource &&
    state.currentPage === lastPaginatedPage &&
    state.pageSize === lastPaginatedSize
  ) {
    return cachedPaginatedProducts;
  }

  lastPaginatedSource = filtered;
  lastPaginatedPage = state.currentPage;
  lastPaginatedSize = state.pageSize;

  const startIndex = (state.currentPage - 1) * state.pageSize;
  cachedPaginatedProducts = filtered.slice(startIndex, startIndex + state.pageSize);
  return cachedPaginatedProducts;
};

let lastPaginationInfoSource: Product[] | null = null;
let lastPaginationInfoPage: number | null = null;
let lastPaginationInfoSize: number | null = null;
let cachedPaginationInfo: PaginationInfo = {
  currentPage: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

/**
 * Seletor que calcula informações de paginação derivadas (total de páginas, contagens, etc.).
 */
export const selectPaginationInfo = (state: ProductStoreState): PaginationInfo => {
  const filtered = selectFilteredProducts(state);

  if (
    filtered === lastPaginationInfoSource &&
    state.currentPage === lastPaginationInfoPage &&
    state.pageSize === lastPaginationInfoSize
  ) {
    return cachedPaginationInfo;
  }

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  const currentPage = Math.min(state.currentPage, totalPages);

  lastPaginationInfoSource = filtered;
  lastPaginationInfoPage = state.currentPage;
  lastPaginationInfoSize = state.pageSize;

  cachedPaginationInfo = {
    currentPage,
    pageSize: state.pageSize,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

  return cachedPaginationInfo;
};

let lastBoundsProducts: Product[] | null = null;
let cachedPriceBounds = { min: 0, max: 10000 };

/**
 * Seletor que computa limites de preço (menor e maior valor) a partir de todo o acervo.
 */
export const selectPriceRangeBounds = (state: ProductStoreState): { min: number; max: number } => {
  if (state.products === lastBoundsProducts) {
    return cachedPriceBounds;
  }

  lastBoundsProducts = state.products;

  if (state.products.length === 0) {
    cachedPriceBounds = { min: 0, max: 10000 };
    return cachedPriceBounds;
  }

  const prices = state.products.map((p) => p.price);
  cachedPriceBounds = {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  };

  return cachedPriceBounds;
};

/**
 * Seletor para listar todas as categorias únicas atualmente disponíveis no catálogo.
 */
export const selectAvailableCategories = (state: ProductStoreState): ProductCategory[] => {
  const categoriesSet = new Set<ProductCategory>();
  state.products.forEach((p) => categoriesSet.add(p.category));
  return Array.from(categoriesSet);
};
