import { Product, CreateProductInput, ProductFilterCriteria } from '@/types/product';
import { INITIAL_SUZANO_PRODUCTS } from './mockData';

export interface IProductService {
  fetchProducts(delayMs?: number): Promise<Product[]>;
  fetchProductById(id: string, delayMs?: number): Promise<Product | null>;
  createProduct(input: CreateProductInput, delayMs?: number): Promise<Product>;
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
      inStock: input.inStock ?? true,
    };

    this.products = [newProduct, ...this.products];
    return JSON.parse(JSON.stringify(newProduct));
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
