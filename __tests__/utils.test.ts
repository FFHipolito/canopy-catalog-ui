import { formatCurrencyBRL, formatNumberBR } from '@/utils/formatters';
import { getStockStatus, CATEGORY_STYLES } from '@/utils/productHelpers';
import { Product } from '@/types/product';

describe('formatters utility', () => {
  it('deve formatar valores monetários em BRL corretamente', () => {
    const formatted = formatCurrencyBRL(1250.5);
    // Substitui espaços normais e non-breaking spaces para comparação estável
    expect(formatted.replace(/\s/g, ' ')).toMatch(/R\$\s?1\.250,50/);
  });

  it('deve formatar números no padrão brasileiro', () => {
    const formatted = formatNumberBR(1000000);
    expect(formatted).toBe('1.000.000');
  });
});

describe('productHelpers utility', () => {
  const baseProduct: Product = {
    id: 'test-1',
    name: 'Produto Teste',
    category: 'Celulose',
    price: 100,
    description: 'Desc',
    imageUrl: 'https://example.com/img.jpg',
  };

  it('deve retornar status "Esgotado" quando inStock for false ou stockQuantity for 0', () => {
    const outOfStock1 = getStockStatus({ ...baseProduct, inStock: false });
    expect(outOfStock1.label).toBe('Esgotado');
    expect(outOfStock1.isOutOfStock).toBe(true);
    expect(outOfStock1.barPercent).toBe(0);

    const outOfStock2 = getStockStatus({ ...baseProduct, stockQuantity: 0 });
    expect(outOfStock2.label).toBe('Esgotado');
    expect(outOfStock2.isOutOfStock).toBe(true);
  });

  it('deve retornar status "Estoque Baixo" quando stockQuantity for maior que 0 e menor que 5', () => {
    const lowStock = getStockStatus({ ...baseProduct, stockQuantity: 3 });
    expect(lowStock.label).toBe('Estoque Baixo (3 un.)');
    expect(lowStock.isOutOfStock).toBe(false);
    expect(lowStock.barPercent).toBeGreaterThan(0);
  });

  it('deve retornar status "Disponível" nos demais casos', () => {
    const inStock = getStockStatus({ ...baseProduct, stockQuantity: 15 });
    expect(inStock.label).toBe('Disponível');
    expect(inStock.isOutOfStock).toBe(false);
    expect(inStock.barPercent).toBe(100);
  });

  it('deve conter estilos definidos para todas as categorias válidas', () => {
    expect(CATEGORY_STYLES['Celulose']).toBeDefined();
    expect(CATEGORY_STYLES['Papéis de Imprimir e Escrever']).toBeDefined();
    expect(CATEGORY_STYLES['Embalagens e Papelcartão']).toBeDefined();
    expect(CATEGORY_STYLES['Bens de Consumo / Tissue']).toBeDefined();
    expect(CATEGORY_STYLES['Bioprodutos e Inovação']).toBeDefined();
  });
});
