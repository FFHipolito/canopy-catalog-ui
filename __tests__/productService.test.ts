import { ProductService, productService } from '@/services/productService';
import { INITIAL_SUZANO_PRODUCTS } from '@/services/mockData';
import { CreateProductInput, ProductFilterCriteria } from '@/types/product';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    service = new ProductService(INITIAL_SUZANO_PRODUCTS, 0);
  });

  it('deve utilizar a instância padrão productService exportada', async () => {
    expect(productService).toBeInstanceOf(ProductService);
  });

  it('deve buscar todos os produtos com fetchProducts', async () => {
    const products = await service.fetchProducts(0);
    expect(products.length).toBe(INITIAL_SUZANO_PRODUCTS.length);
    expect(products[0].name).toBe(INITIAL_SUZANO_PRODUCTS[0].name);
  });

  it('deve buscar produto por ID existente com fetchProductById', async () => {
    const target = INITIAL_SUZANO_PRODUCTS[0];
    const found = await service.fetchProductById(target.id, 0);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(target.id);
  });

  it('deve retornar null ao buscar por ID inexistente', async () => {
    const notFound = await service.fetchProductById('id-inexistente-123', 0);
    expect(notFound).toBeNull();
  });

  it('deve criar um novo produto com createProduct', async () => {
    const input: CreateProductInput = {
      name: 'Bobina Papel Kraft Especial',
      category: 'Embalagens e Papelcartão',
      price: 2500,
      description: 'Bobina de alta resistência para sacolas ecológicas.',
      imageUrl: 'https://images.unsplash.com/photo-test',
      sku: 'KRF-ESP-01',
      unit: 'Bobina 500kg',
      stockQuantity: 12,
    };

    const created = await service.createProduct(input, 0);
    expect(created.id).toContain('suz-');
    expect(created.name).toBe(input.name);
    expect(created.stockQuantity).toBe(12);
    expect(created.inStock).toBe(true);

    const list = await service.fetchProducts(0);
    expect(list[0].id).toBe(created.id);
  });

  it('deve criar produto com estoque zero e inStock falso quando stockQuantity for 0', async () => {
    const input: CreateProductInput = {
      name: 'Produto Esgotado Teste',
      category: 'Celulose',
      price: 1000,
      description: 'Descrição de teste para esgotado.',
      imageUrl: 'https://images.unsplash.com/photo-test',
      stockQuantity: 0,
    };

    const created = await service.createProduct(input, 0);
    expect(created.stockQuantity).toBe(0);
    expect(created.inStock).toBe(false);
  });

  it('deve criar produto sem stockQuantity usando inStock default true', async () => {
    const input: CreateProductInput = {
      name: 'Produto Sem StockQuantity',
      category: 'Celulose',
      price: 1000,
      description: 'Descrição de teste sem stockQuantity.',
      imageUrl: 'https://images.unsplash.com/photo-test',
    };

    const created = await service.createProduct(input, 0);
    expect(created.stockQuantity).toBe(0);
    expect(created.inStock).toBe(true);
  });

  it('deve atualizar um produto existente com updateProduct', async () => {
    const target = INITIAL_SUZANO_PRODUCTS[0];
    const updated = await service.updateProduct(
      target.id,
      {
        name: 'Nome Atualizado',
        price: 999.9,
        stockQuantity: 30,
      },
      0
    );

    expect(updated.name).toBe('Nome Atualizado');
    expect(updated.price).toBe(999.9);
    expect(updated.stockQuantity).toBe(30);
    expect(updated.inStock).toBe(true);
  });

  it('deve atualizar produto para inStock false ao definir stockQuantity 0', async () => {
    const target = INITIAL_SUZANO_PRODUCTS[0];
    const updated = await service.updateProduct(
      target.id,
      {
        stockQuantity: 0,
      },
      0
    );

    expect(updated.stockQuantity).toBe(0);
    expect(updated.inStock).toBe(false);
  });

  it('deve lançar erro ao tentar atualizar produto inexistente', async () => {
    await expect(
      service.updateProduct('id-inexistente', { name: 'Falha' }, 0)
    ).rejects.toThrow('Produto com ID "id-inexistente" não encontrado para atualização.');
  });

  describe('filterAndSort', () => {
    const defaultCriteria: ProductFilterCriteria = {
      searchQuery: '',
      category: 'ALL',
      minPrice: null,
      maxPrice: null,
      sort: 'name-asc',
      onlyInStock: false,
    };

    it('deve filtrar por searchQuery pelo nome', () => {
      const result = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        searchQuery: 'Report',
      });
      expect(result.every((p) => p.name.toLowerCase().includes('report'))).toBe(true);
    });

    it('deve filtrar por searchQuery pela descrição', () => {
      const result = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        searchQuery: 'alcalino',
      });
      expect(result.length).toBeGreaterThan(0);
    });

    it('deve filtrar por searchQuery pelo SKU', () => {
      const result = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        searchQuery: 'REP-A4-75G',
      });
      expect(result.length).toBe(1);
    });

    it('deve filtrar por categoria específica', () => {
      const result = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        category: 'Celulose',
      });
      expect(result.every((p) => p.category === 'Celulose')).toBe(true);
    });

    it('deve filtrar por faixa de preço mínima e máxima', () => {
      const result = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        minPrice: 50,
        maxPrice: 2000,
      });
      expect(result.every((p) => p.price >= 50 && p.price <= 2000)).toBe(true);
    });

    it('deve filtrar apenas produtos com estoque disponível', () => {
      const result = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        onlyInStock: true,
      });
      expect(
        result.every(
          (p) => p.inStock !== false && (p.stockQuantity === undefined || p.stockQuantity > 0)
        )
      ).toBe(true);
    });

    it('deve ordenar por price-asc e price-desc', () => {
      const asc = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        sort: 'price-asc',
      });
      expect(asc[0].price).toBeLessThanOrEqual(asc[asc.length - 1].price);

      const desc = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        sort: 'price-desc',
      });
      expect(desc[0].price).toBeGreaterThanOrEqual(desc[desc.length - 1].price);
    });

    it('deve ordenar por name-desc e default', () => {
      const desc = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        sort: 'name-desc',
      });
      expect(desc.length).toBe(INITIAL_SUZANO_PRODUCTS.length);

      const def = service.filterAndSort(INITIAL_SUZANO_PRODUCTS, {
        ...defaultCriteria,
        sort: 'desconhecido' as any,
      });
      expect(def.length).toBe(INITIAL_SUZANO_PRODUCTS.length);
    });
  });
});
