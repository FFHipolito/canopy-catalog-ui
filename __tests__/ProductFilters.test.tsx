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

  it('deve renderizar a barra de busca, categorias e inputs de preço quando expandido', () => {
    render(<ProductFilters defaultExpanded={true} />);

    expect(
      screen.getByPlaceholderText(/Buscar por nome, SKU ou descrição/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Celulose')).toBeInTheDocument();
    expect(screen.getByText('Embalagens e Papelcartão')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtrar/i })).toBeInTheDocument();
  });

  it('deve abrir e fechar o painel recolhível ao clicar no botão Filtros', async () => {
    const user = userEvent.setup();
    render(<ProductFilters defaultExpanded={false} />);

    expect(screen.queryByText('Todas')).not.toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: /Filtros/i });
    await user.click(toggleButton);

    expect(screen.getByText('Todas')).toBeInTheDocument();
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
    render(<ProductFilters defaultExpanded={true} />);

    const categoryButton = screen.getByRole('button', { name: 'Celulose' });
    await user.click(categoryButton);

    const filtered = selectFilteredProducts(useProductStore.getState());
    expect(filtered.every((p) => p.category === 'Celulose')).toBe(true);
    expect(filtered.length).toBe(1);
  });

  it('deve restaurar todos os filtros ao clicar no botão Limpar', async () => {
    const user = userEvent.setup();
    render(<ProductFilters defaultExpanded={true} />);

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

  it('deve abrir o menu de ordenação e atualizar o critério ao selecionar uma opção', async () => {
    const user = userEvent.setup();
    render(<ProductFilters />);

    // Inicialmente o menu suspenso não está visível
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Clica no botão de ordenação atual
    const sortButton = screen.getByRole('button', { name: /Ordenar produtos: Nome \(A a Z\)/i });
    await user.click(sortButton);

    // O menu suspenso deve estar aberto com a lista de opções
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Maior Preço/i })).toBeInTheDocument();

    // Clica na opção "Maior Preço"
    await user.click(screen.getByRole('option', { name: /Maior Preço/i }));

    // O menu deve fechar e a store deve ser atualizada
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(useProductStore.getState().filterCriteria.sort).toBe('price-desc');
  });

  it('deve fechar o menu de ordenação ao pressionar a tecla Escape', async () => {
    const user = userEvent.setup();
    render(<ProductFilters />);

    const sortButton = screen.getByRole('button', { name: /Ordenar produtos: Nome \(A a Z\)/i });
    await user.click(sortButton);

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('deve alternar o filtro de produtos com estoque disponível', async () => {
    const user = userEvent.setup();
    render(<ProductFilters defaultExpanded={true} />);

    const stockSwitch = screen.getByRole('switch', {
      name: /Apenas produtos com estoque disponível/i,
    });
    expect(stockSwitch).toBeInTheDocument();
    expect(useProductStore.getState().filterCriteria.onlyInStock).toBeFalsy();

    await user.click(stockSwitch);
    expect(useProductStore.getState().filterCriteria.onlyInStock).toBe(true);

    await user.click(stockSwitch);
    expect(useProductStore.getState().filterCriteria.onlyInStock).toBe(false);
  });
});
