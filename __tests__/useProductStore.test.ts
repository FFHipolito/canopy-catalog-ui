import {
  createProductStore,
  selectPaginatedProducts,
  selectPaginationInfo,
  selectPriceRangeBounds,
  selectAvailableCategories,
} from '@/store/useProductStore';
import { IProductService } from '@/services/productService';
import { Product } from '@/types/product';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Papel Offset Suzano Report',
    category: 'Papéis de Imprimir e Escrever',
    price: 32.0,
    description: 'Papel sulfite para impressão e escrita.',
    imageUrl: 'https://example.com/1.jpg',
    inStock: true,
  },
  {
    id: 'prod-2',
    name: 'Celulose Microfibrilada MFC',
    category: 'Bioprodutos e Inovação',
    price: 9500.0,
    description: 'Nanocelulose e celulose microfibrilada.',
    imageUrl: 'https://example.com/2.jpg',
    inStock: true,
  },
];

describe('useProductStore & Computed Selectors', () => {
  let mockService: IProductService;

  beforeEach(() => {
    mockService = {
      fetchProducts: jest.fn().mockResolvedValue([...mockProducts]),
      fetchProductById: jest.fn().mockResolvedValue(mockProducts[0]),
      createProduct: jest.fn().mockImplementation(async (input) => ({
        ...input,
        id: 'new-id-999',
        createdAt: new Date().toISOString(),
      })),
      updateProduct: jest.fn().mockImplementation(async (id, updates) => {
        const found = mockProducts.find((p) => p.id === id);
        return {
          ...(found || mockProducts[0]),
          ...updates,
          id,
        };
      }),
      filterAndSort: jest.fn().mockImplementation((prods, criteria) => {
        let result = [...prods];
        if (criteria.searchQuery) {
          result = result.filter((p) =>
            p.name.toLowerCase().includes(criteria.searchQuery.toLowerCase())
          );
        }
        if (criteria.sort === 'price-asc') {
          result.sort((a, b) => a.price - b.price);
        }
        return result;
      }),
    };
  });

  it('deve carregar produtos através de fetchProducts', async () => {
    const store = createProductStore(mockService);
    await store.getState().fetchProducts();

    expect(store.getState().products).toHaveLength(2);
    expect(store.getState().isLoading).toBe(false);
  });

  it('deve cadastrar um novo produto e inseri-lo no topo', async () => {
    const store = createProductStore(mockService);
    await store.getState().fetchProducts();

    await store.getState().addProduct({
      name: 'Novo Bioplástico Sustentável',
      category: 'Bioprodutos e Inovação',
      price: 15000,
      description: 'Polímero 100% biodegradável à base de lignina.',
      imageUrl: 'https://example.com/new.jpg',
    });

    const products = store.getState().products;
    expect(products).toHaveLength(3);
    expect(products[0].name).toBe('Novo Bioplástico Sustentável');
    expect(store.getState().currentPage).toBe(1);
  });

  it('deve atualizar um produto existente na store', async () => {
    const store = createProductStore(mockService);
    await store.getState().fetchProducts();

    const updated = await store.getState().updateProduct('prod-1', {
      name: 'Celulose Kraft Modificada',
      price: 3800,
    });

    expect(updated.name).toBe('Celulose Kraft Modificada');
    expect(updated.price).toBe(3800);

    const productInStore = store.getState().products.find((p) => p.id === 'prod-1');
    expect(productInStore?.name).toBe('Celulose Kraft Modificada');
    expect(productInStore?.price).toBe(3800);
  });

  it('deve calcular corretamente a paginação através do seletor selectPaginationInfo', async () => {
    const store = createProductStore(mockService);
    await store.getState().fetchProducts();
    store.getState().setPageSize(1);

    const pagination = selectPaginationInfo(store.getState());
    expect(pagination.totalPages).toBe(2);
    expect(pagination.hasNextPage).toBe(true);
    expect(pagination.hasPrevPage).toBe(false);

    const page1Items = selectPaginatedProducts(store.getState());
    expect(page1Items).toHaveLength(1);
  });

  it('deve atualizar critérios de filtro e resetar filtros', () => {
    const store = createProductStore(mockService);

    store.getState().setSearchQuery('papel');
    expect(store.getState().filterCriteria.searchQuery).toBe('papel');
    expect(store.getState().currentPage).toBe(1);

    store.getState().setCategory('Celulose');
    expect(store.getState().filterCriteria.category).toBe('Celulose');

    store.getState().setPriceRange(100, 500);
    expect(store.getState().filterCriteria.minPrice).toBe(100);
    expect(store.getState().filterCriteria.maxPrice).toBe(500);

    store.getState().setSort('price-desc');
    expect(store.getState().filterCriteria.sort).toBe('price-desc');

    store.getState().setOnlyInStock(true);
    expect(store.getState().filterCriteria.onlyInStock).toBe(true);

    store.getState().setCurrentPage(3);
    expect(store.getState().currentPage).toBe(3);

    store.getState().resetFilters();
    expect(store.getState().filterCriteria.searchQuery).toBe('');
    expect(store.getState().filterCriteria.category).toBe('ALL');
    expect(store.getState().filterCriteria.minPrice).toBeNull();
    expect(store.getState().filterCriteria.maxPrice).toBeNull();
    expect(store.getState().filterCriteria.sort).toBe('name-asc');
    expect(store.getState().filterCriteria.onlyInStock).toBe(false);
  });

  it('deve tratar erros em fetchProducts, addProduct e updateProduct', async () => {
    const failingService: IProductService = {
      ...mockService,
      fetchProducts: jest.fn().mockRejectedValue(new Error('Erro ao carregar')),
      createProduct: jest.fn().mockRejectedValue(new Error('Erro ao criar')),
      updateProduct: jest.fn().mockRejectedValue(new Error('Erro ao atualizar')),
    };

    const store = createProductStore(failingService);

    await store.getState().fetchProducts();
    expect(store.getState().error).toBe('Erro ao carregar');
    expect(store.getState().isLoading).toBe(false);

    await expect(
      store.getState().addProduct({
        name: 'Item Falha',
        category: 'Celulose',
        price: 100,
        description: 'Descrição',
        imageUrl: '',
      })
    ).rejects.toThrow('Erro ao criar');
    expect(store.getState().error).toBe('Erro ao criar');

    await expect(
      store.getState().updateProduct('prod-1', { name: 'Falha Update' })
    ).rejects.toThrow('Erro ao atualizar');
    expect(store.getState().error).toBe('Erro ao atualizar');

    // Testar com erros que não são instâncias de Error
    const stringFailingService: IProductService = {
      ...mockService,
      fetchProducts: jest.fn().mockRejectedValue('Falha string'),
      createProduct: jest.fn().mockRejectedValue('Falha string'),
      updateProduct: jest.fn().mockRejectedValue('Falha string'),
    };
    const store2 = createProductStore(stringFailingService);
    await store2.getState().fetchProducts();
    expect(store2.getState().error).toBe('Falha ao carregar catálogo de produtos');

    await expect(
      store2.getState().addProduct({
        name: 'Item',
        category: 'Celulose',
        price: 10,
        description: 'Desc',
        imageUrl: '',
      })
    ).rejects.toBe('Falha string');
    expect(store2.getState().error).toBe('Erro ao cadastrar produto');

    await expect(
      store2.getState().updateProduct('prod-1', { name: 'Item' })
    ).rejects.toBe('Falha string');
    expect(store2.getState().error).toBe('Erro ao atualizar produto');
  });

  it('deve lidar com setPriceRange com parâmetros undefined/null e paginação', () => {
    const store = createProductStore(mockService);
    store.getState().setPriceRange(undefined, undefined);
    expect(store.getState().filterCriteria.minPrice).toBeNull();
    expect(store.getState().filterCriteria.maxPrice).toBeNull();

    store.getState().setPageSize(20);
    expect(store.getState().pageSize).toBe(20);
    expect(store.getState().currentPage).toBe(1);
  });

  it('deve retornar do cache quando selectPaginatedProducts e selectPaginationInfo forem chamados repetidamente com o mesmo estado', () => {
    const store = createProductStore(mockService);
    store.setState({ products: mockProducts });

    const paginated1 = selectPaginatedProducts(store.getState());
    const paginated2 = selectPaginatedProducts(store.getState());
    expect(paginated1).toBe(paginated2);

    const info1 = selectPaginationInfo(store.getState());
    const info2 = selectPaginationInfo(store.getState());
    expect(info1).toBe(info2);
  });

  it('deve calcular e cachear limites de preço com selectPriceRangeBounds', () => {
    const store = createProductStore(mockService);

    // Estado vazio
    store.setState({ products: [] });
    const emptyBounds = selectPriceRangeBounds(store.getState());
    expect(emptyBounds).toEqual({ min: 0, max: 10000 });

    // Com produtos
    store.setState({ products: mockProducts });
    const bounds1 = selectPriceRangeBounds(store.getState());
    expect(bounds1).toEqual({ min: 32, max: 9500 });

    // Cache hit
    const bounds2 = selectPriceRangeBounds(store.getState());
    expect(bounds2).toBe(bounds1);
  });

  it('deve listar categorias únicas com selectAvailableCategories', () => {
    const store = createProductStore(mockService);
    store.setState({ products: mockProducts });

    const categories = selectAvailableCategories(store.getState());
    expect(categories).toContain('Papéis de Imprimir e Escrever');
    expect(categories).toContain('Bioprodutos e Inovação');
    expect(categories.length).toBe(2);
  });
});
