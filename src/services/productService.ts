import { Product, CreateProductInput, ProductFilterCriteria } from '@/types/product';
import { INITIAL_SUZANO_PRODUCTS } from './mockData';

export interface IProductService {
  fetchProducts(delayMs?: number): Promise<Product[]>;
  fetchProductById(id: string, delayMs?: number): Promise<Product | null>;
  createProduct(input: CreateProductInput, delayMs?: number): Promise<Product>;
  updateProduct(id: string, updates: Partial<CreateProductInput>, delayMs?: number): Promise<Product>;
  filterAndSort(products: Product[], criteria: ProductFilterCriteria): Product[];
}

export class ProductService implements IProductService {
  private products: Product[];
  private defaultDelay: number;

  constructor(initialData: Product[] = INITIAL_SUZANO_PRODUCTS, defaultDelay: number = 600) {
    this.products = JSON.parse(JSON.stringify(initialData));
    this.defaultDelay = defaultDelay;
  }

  async fetchProducts(delayMs: number = this.defaultDelay): Promise<Product[]> {
    await this.simulateLatency(delayMs);
    return JSON.parse(JSON.stringify(this.products));
  }

  async fetchProductById(id: string, delayMs: number = this.defaultDelay): Promise<Product | null> {
    await this.simulateLatency(delayMs);
    const item = this.products.find((p) => p.id === id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async createProduct(input: CreateProductInput, delayMs: number = this.defaultDelay): Promise<Product> {
    await this.simulateLatency(delayMs);

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const timestamp = Date.now().toString(36);
    const newProduct: Product = {
      ...input,
      id: ['suz', timestamp, randomSuffix].join('-'),
      createdAt: new Date().toISOString(),
      stockQuantity: input.stockQuantity !== undefined ? Number(input.stockQuantity) : 0,
      inStock:
        input.stockQuantity !== undefined
          ? Number(input.stockQuantity) > 0
          : input.inStock ?? true,
    };

    this.products = [newProduct, ...this.products];
    return JSON.parse(JSON.stringify(newProduct));
  }

  async updateProduct(
    id: string,
    updates: Partial<CreateProductInput>,
    delayMs: number = this.defaultDelay
  ): Promise<Product> {
    await this.simulateLatency(delayMs);

    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Produto com ID "${id}" não encontrado para atualização.`);
    }

    const updatedProduct: Product = {
      ...this.products[index],
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : this.products[index].price,
      stockQuantity:
        updates.stockQuantity !== undefined
          ? Number(updates.stockQuantity)
          : this.products[index].stockQuantity,
      inStock:
        updates.stockQuantity !== undefined
          ? Number(updates.stockQuantity) > 0
          : updates.inStock !== undefined
          ? updates.inStock
          : this.products[index].inStock,
    };

    this.products[index] = updatedProduct;
    return JSON.parse(JSON.stringify(updatedProduct));
  }

  filterAndSort(products: Product[], criteria: ProductFilterCriteria): Product[] {
    const { searchQuery, category, minPrice, maxPrice, sort } = criteria;

    return products
      .filter((product) => {
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesName = product.name.toLowerCase().includes(query);
          const matchesDescription = product.description.toLowerCase().includes(query);
          const matchesSku = product.sku ? product.sku.toLowerCase().includes(query) : false;
          if (!matchesName && !matchesDescription && !matchesSku) {
            return false;
          }
        }

        if (category && category !== 'ALL') {
          if (product.category !== category) {
            return false;
          }
        }

        if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
          if (product.price < minPrice) {
            return false;
          }
        }

        if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
          if (product.price > maxPrice) {
            return false;
          }
        }

        if (criteria.onlyInStock) {
          const isOutOfStock =
            product.inStock === false ||
            (product.stockQuantity !== undefined && product.stockQuantity <= 0);
          if (isOutOfStock) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'name-asc':
            return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
          case 'name-desc':
            return b.name.localeCompare(a.name, 'pt-BR', { sensitivity: 'base' });
          default:
            return 0;
        }
      });
  }

  private simulateLatency(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const productService = new ProductService();
