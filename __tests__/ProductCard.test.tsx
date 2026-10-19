import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/types/product';

const mockProduct: Product = {
  id: 'suz-test-001',
  name: 'Celulose Bleached Eucalyptus Kraft',
  category: 'Celulose',
  price: 4350.5,
  description: 'Celulose branqueada de eucalipto de fibra curta de alta pureza e sustentabilidade.',
  imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  sku: 'CEL-BEKP-001',
  inStock: true,
  unit: 'tonelada',
};

describe('ProductCard Component', () => {
  // 1. Teste de Snapshot Obrigatório
  it('deve corresponder ao snapshot estrutural', () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    expect(container).toMatchSnapshot();
  });

  // 2. Teste de renderização de propriedades essenciais
  it('deve renderizar corretamente o nome, categoria, preço formatado em BRL e SKU', () => {
    render(<ProductCard product={mockProduct} />);

    // Nome
    expect(
      screen.getByRole('heading', { name: mockProduct.name, level: 3 })
    ).toBeInTheDocument();

    // Categoria
    expect(screen.getByText('Celulose')).toBeInTheDocument();

    // Preço Formatado
    expect(screen.getByText(/4\.350,50/)).toBeInTheDocument();

    // SKU e Unidade
    expect(screen.getByText(/CEL-BEKP-001/)).toBeInTheDocument();
    expect(screen.getByText(/tonelada/)).toBeInTheDocument();

    // Badge de Disponibilidade
    expect(screen.getByText('Disponível')).toBeInTheDocument();
  });

  // 3. Teste de fallback visual quando imagem falha
  it('deve exibir fallback visual quando a imagem disparar erro de carregamento', () => {
    render(<ProductCard product={mockProduct} />);

    const imageElement = screen.getByAltText(mockProduct.name);
    fireEvent.error(imageElement);

    expect(screen.getByText('Imagem indisponível')).toBeInTheDocument();
  });
});
