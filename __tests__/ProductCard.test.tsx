import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  // 4. Teste de onLoad da imagem
  it('deve remover estado de loading ao disparar evento de onLoad na imagem', async () => {
    render(<ProductCard product={mockProduct} />);
    const imageElement = screen.getByAltText(mockProduct.name);
    fireEvent.load(imageElement);
    await waitFor(() => {
      expect(imageElement).toHaveClass('opacity-100');
    });
  });

  // 5. Teste de Estoque Baixo
  it('deve renderizar status Estoque Baixo quando quantidade for entre 1 e 4', () => {
    render(<ProductCard product={{ ...mockProduct, stockQuantity: 2 }} />);
    expect(screen.getByText('Estoque Baixo (2 un.)')).toBeInTheDocument();
  });

  // 6. Teste de Esgotado
  it('deve renderizar status Esgotado quando estoque for 0 ou inStock for false', () => {
    render(<ProductCard product={{ ...mockProduct, stockQuantity: 0, inStock: false }} />);
    expect(screen.getByText('Esgotado')).toBeInTheDocument();
  });

  // 7. Teste de produto sem imagem
  it('deve exibir fallback quando imageUrl for vazio', () => {
    render(<ProductCard product={{ ...mockProduct, imageUrl: '' }} />);
    expect(screen.getByText('Imagem indisponível')).toBeInTheDocument();
  });

  // 8. Teste de expansão da descrição ao clicar em 'mais'
  it('deve alternar entre mais e menos ao clicar no botão de descrição', () => {
    render(<ProductCard product={mockProduct} />);

    const moreButton = screen.getByRole('button', { name: /mais/i });
    expect(moreButton).toBeInTheDocument();

    fireEvent.click(moreButton);
    expect(screen.getByRole('button', { name: /menos/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /menos/i }));
    expect(screen.getByRole('button', { name: /mais/i })).toBeInTheDocument();
  });

  // 9. Teste de clique no botão Atualizar
  it('deve disparar onEdit ao clicar no botão Atualizar do card', () => {
    const handleEdit = jest.fn();
    render(<ProductCard product={mockProduct} onEdit={handleEdit} />);

    const editButton = screen.getByRole('button', { name: /Atualizar/i });
    fireEvent.click(editButton);

    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(mockProduct);
  });
});
