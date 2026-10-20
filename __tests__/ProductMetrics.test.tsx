import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProductMetrics } from '@/components/ProductMetrics';
import { Product } from '@/types/product';

const mockProductsList: Product[] = [
  {
    id: 'prod-1',
    name: 'Papel Offset Suzano Report',
    category: 'Papéis de Imprimir e Escrever',
    price: 100,
    description: 'Papel sulfite para impressão.',
    imageUrl: 'https://example.com/1.jpg',
    stockQuantity: 25,
    inStock: true,
  },
  {
    id: 'prod-2',
    name: 'Válvula Reguladora de Pressão',
    category: 'Bioprodutos e Inovação',
    price: 300,
    description: 'Válvula em inox.',
    imageUrl: 'https://example.com/2.jpg',
    stockQuantity: 2, // Crítico (< 5)
    inStock: true,
  },
  {
    id: 'prod-3',
    name: 'Sensor IoT Industrial',
    category: 'Bioprodutos e Inovação',
    price: 200,
    description: 'Sensor industrial.',
    imageUrl: 'https://example.com/3.jpg',
    stockQuantity: 0, // Esgotado
    inStock: false,
  },
];

describe('ProductMetrics Component', () => {
  it('deve calcular e exibir Total de Itens Ativos, Preço Médio e Alertas de Reposição', () => {
    render(<ProductMetrics products={mockProductsList} />);

    // Total de itens ativos
    expect(screen.getByText('Total de Itens Ativos')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('produtos visíveis')).toBeInTheDocument();

    // Preço médio ((100 + 300 + 200) / 3 = 200)
    expect(screen.getByText('Preço Médio do Catálogo')).toBeInTheDocument();
    expect(screen.getByText(/200,00/)).toBeInTheDocument();

    // Alertas de reposição: prod-2 (2 un.) + prod-3 (0 un.) = 2 itens críticos
    expect(screen.getByText('Alertas de Reposição')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('itens críticos (< 5 un.)')).toBeInTheDocument();
  });

  it('deve lidar graciosamente com lista vazia de produtos', () => {
    render(<ProductMetrics products={[]} />);

    // Total de itens ativos = 0 e Alertas = 0
    expect(screen.getAllByText('0')).toHaveLength(2);

    // Preço médio = 0,00
    expect(screen.getByText(/0,00/)).toBeInTheDocument();
  });

  it('deve exibir singular quando houver apenas 1 produto e 1 alerta', () => {
    const singleProduct: Product[] = [
      {
        id: 'prod-single',
        name: 'Muda de Eucalipto',
        category: 'Bioprodutos e Inovação',
        price: 15,
        description: 'Muda clonal.',
        imageUrl: 'https://example.com/single.jpg',
        stockQuantity: 3,
        inStock: true,
      },
    ];

    render(<ProductMetrics products={singleProduct} />);

    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getByText('produto visível')).toBeInTheDocument();
    expect(screen.getByText('item crítico (< 5 un.)')).toBeInTheDocument();
  });
});
