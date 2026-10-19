import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFilters } from '@/components/ProductFilters';
import { useProductStore, selectFilteredProducts } from '@/store/useProductStore';
import { Product } from '@/types/product';

const mockCatalog: Product[] = [
  {
    id: 'suz-1',
    name: 'Celulose Kraft Eucalipto Bleached',
    category: 'Celulose',
    price: 3450,
    description: 'Celulose de eucalipto branqueada com certificação FSC.',
    imageUrl: 'https://images.unsplash.com/photo-1',
    sku: 'CEL-001',
    inStock: true,
  },
  {
    id: 'suz-2',
    name: 'Papelcartão TP White Premium',
    category: 'Embalagens e Papelcartão',
    price: 5200,
    description: 'Papelcartão virgem de alta rigidez para embalagens.',
    imageUrl: 'https://images.unsplash.com/photo-2',
    sku: 'CART-002',
    inStock: true,
  },
  {
    id: 'suz-3',
    name: 'Lignina Kraft Ecológica Bioproduto',
    category: 'Bioprodutos e Inovação',
    price: 8900,
    description: 'Polímero natural renovável substituto de derivados fósseis.',
    imageUrl: 'https://images.unsplash.com/photo-3',
    sku: 'BIO-003',
    inStock: true,
  },
];

describe('ProductFilters Component', () => {
  beforeEach(() => {
    // Configura a store com dados mock conhecidos
    useProductStore.setState({
      products: mockCatalog,
      filterCriteria: {
        searchQuery: '',
        category: 'ALL',
        minPrice: null,
        maxPrice: null,
        sort: 'name-asc',
      },
      currentPage: 1,
      pageSize: 6,
    });
  });

  it('deve renderizar a barra de busca, categorias e inputs de preço', () => {
    render(<ProductFilters />);

    expect(
      screen.getByPlaceholderText(/Buscar por nome, SKU ou descrição/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Celulose')).toBeInTheDocument();
    expect(screen.getByText('Embalagens e Papelcartão')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtrar/i })).toBeInTheDocument();
  });

  // Requisito obrigatório: Teste garantindo que a filtragem por nome atualiza os elementos renderizados
  it('deve atualizar o estado de filtragem por nome após digitação com debounce', async () => {
    const user = userEvent.setup();
    render(<ProductFilters />);

    const searchInput = screen.getByPlaceholderText(/Buscar por nome, SKU ou descrição/i);
    await user.type(searchInput, 'Lignina');

    // Aguarda o debounce de 300ms disparar a atualização na store
    await waitFor(
      () => {
        const filtered = selectFilteredProducts(useProductStore.getState());
        expect(filtered.length).toBe(1);
        expect(filtered[0].name).toBe('Lignina Kraft Ecológica Bioproduto');
      },
      { timeout: 1000 }
    );
  });

  it('deve filtrar produtos pela categoria selecionada', async () => {
    const user = userEvent.setup();
    render(<ProductFilters />);

    const categoryButton = screen.getByRole('button', { name: 'Celulose' });
    await user.click(categoryButton);

    const filtered = selectFilteredProducts(useProductStore.getState());
    expect(filtered.every((p) => p.category === 'Celulose')).toBe(true);
    expect(filtered.length).toBe(1);
  });

  it('deve restaurar todos os filtros ao clicar no botão Limpar', async () => {
    const user = userEvent.setup();
    render(<ProductFilters />);

    // Aplica um filtro de categoria
    const categoryButton = screen.getByRole('button', { name: 'Celulose' });
    await user.click(categoryButton);

    // O botão Limpar deve aparecer
    const clearButton = await screen.findByTitle('Restaurar filtros padrões');
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    // Todos os produtos devem retornar
    const filtered = selectFilteredProducts(useProductStore.getState());
    expect(filtered.length).toBe(mockCatalog.length);
  });
});
