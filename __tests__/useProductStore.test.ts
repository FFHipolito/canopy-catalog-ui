import {
  createProductStore,
  selectPaginatedProducts,
  selectPaginationInfo,
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
});
