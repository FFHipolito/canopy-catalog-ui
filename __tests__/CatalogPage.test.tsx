import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatalogPage from '@/app/page';
import { useProductStore } from '@/store/useProductStore';
import { INITIAL_SUZANO_PRODUCTS } from '@/services/mockData';

describe('CatalogPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useProductStore.setState({
      products: INITIAL_SUZANO_PRODUCTS,
      isLoading: false,
      error: null,
      currentPage: 1,
      pageSize: 6,
      filterCriteria: {
        searchQuery: '',
        category: 'ALL',
        minPrice: null,
        maxPrice: null,
        sort: 'name-asc',
        onlyInStock: false,
      },
      fetchProducts: async () => {
        // Fast mock para testes não aguardarem 600ms de delay
        useProductStore.setState({
          isLoading: false,
        });
      },
    });
  });

  it('deve renderizar o cabeçalho, banner corporativo e grid de produtos', () => {
    render(<CatalogPage />);

    expect(screen.getByText('Canopy')).toBeInTheDocument();
    expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    expect(screen.getByText(/Catálogo Corporativo de Produtos/i)).toBeInTheDocument();
    expect(screen.getByTestId('products-grid')).toBeInTheDocument();
  });

  it('deve alternar entre visualização de Catálogo e Inventário (Tabela)', () => {
    render(<CatalogPage />);

    const inventoryButton = screen.getByRole('button', { name: /Inventário/i });
    fireEvent.click(inventoryButton);

    // Deve exibir tabela
    expect(screen.getByRole('table')).toBeInTheDocument();

    const catalogButton = screen.getByRole('button', { name: /Catálogo/i });
    fireEvent.click(catalogButton);

    expect(screen.getByTestId('products-grid')).toBeInTheDocument();
  });

  it('deve alternar entre tema claro e escuro ao clicar no botão de tema', () => {
    render(<CatalogPage />);

    const themeButton = screen.getByLabelText(/Alternar tema claro ou escuro/i);
    fireEvent.click(themeButton);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('canopy_theme')).toBe('dark');

    fireEvent.click(themeButton);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('canopy_theme')).toBe('light');
  });

  it('deve carregar tema escuro salvo no localStorage na inicialização', () => {
    localStorage.setItem('canopy_theme', 'dark');
    render(<CatalogPage />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('deve abrir o modal de novo produto ao clicar no botão Novo Produto', () => {
    render(<CatalogPage />);

    const newProductButton = screen.getByRole('button', { name: /Novo Produto/i });
    fireEvent.click(newProductButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Cadastrar Novo Produto/i })).toBeInTheDocument();
  });

  it('deve abrir o modal de edição ao clicar no botão Atualizar de um produto', () => {
    render(<CatalogPage />);

    const editButtons = screen.getAllByRole('button', { name: /Atualizar/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Atualizar Produto/i })).toBeInTheDocument();
  });

  it('deve exibir skeletons quando isLoading for true', () => {
    useProductStore.setState({
      isLoading: true,
      fetchProducts: async () => {
        // Mantém loading ativo durante este teste
      },
    });
    render(<CatalogPage />);
    expect(screen.getByTestId('products-skeleton')).toBeInTheDocument();
  });

  it('deve exibir empty state quando nenhum produto for encontrado', () => {
    useProductStore.setState({
      products: INITIAL_SUZANO_PRODUCTS,
      filterCriteria: {
        searchQuery: 'termo-inexistente-xyz',
        category: 'ALL',
        minPrice: null,
        maxPrice: null,
        sort: 'name-asc',
        onlyInStock: false,
      },
    });

    render(<CatalogPage />);
    expect(
      screen.getByText('Nenhum produto corresponde aos filtros aplicados')
    ).toBeInTheDocument();

    const resetFiltersButton = screen.getByRole('button', { name: /Limpar filtros e restaurar lista/i });
    fireEvent.click(resetFiltersButton);
    expect(useProductStore.getState().filterCriteria.searchQuery).toBe('');
  });

  it('deve exibir mensagem de erro quando houver falha e permitir tentar novamente', () => {
    useProductStore.setState({
      isLoading: false,
      error: 'Falha de rede simulada',
      fetchProducts: async () => {
        // Mantém erro ativo
      },
    });

    render(<CatalogPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Falha de rede simulada')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Tentar novamente/i });
    fireEvent.click(retryButton);
  });

  it('deve focar o campo de busca ao pressionar a tecla / e limpar com Escape', async () => {
    render(<CatalogPage />);

    const searchInput = screen.getByPlaceholderText(/Buscar por nome, SKU ou descrição.../i);

    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(searchInput);

    await waitFor(() => {
      useProductStore.setState({
        filterCriteria: {
          searchQuery: 'busca ativa',
          category: 'ALL',
          minPrice: null,
          maxPrice: null,
          sort: 'name-asc',
          onlyInStock: false,
        },
      });
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useProductStore.getState().filterCriteria.searchQuery).toBe('');
  });

  it('deve abrir o modal de edição ao clicar no botão editar do card e fechar pelo botão do modal', async () => {
    useProductStore.setState({
      products: INITIAL_SUZANO_PRODUCTS,
      isLoading: false,
    });

    render(<CatalogPage />);

    // Procurar os botões de edição nos cards
    const editButtons = screen.getAllByRole('button', { name: /Atualizar/i });
    expect(editButtons.length).toBeGreaterThan(0);

    fireEvent.click(editButtons[0]);

    // O modal deve estar aberto com o título de atualização
    expect(screen.getByRole('heading', { name: /Atualizar Produto/i })).toBeInTheDocument();

    // Fechar pelo botão de fechar do modal
    const closeBtn = screen.getByRole('button', { name: /Fechar modal/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Atualizar Produto/i })).not.toBeInTheDocument();
    });
  });

  it('deve fechar o modal ao pressionar Escape quando o modal estiver aberto', async () => {
    useProductStore.setState({
      products: INITIAL_SUZANO_PRODUCTS,
      isLoading: false,
    });

    render(<CatalogPage />);

    const newProductBtn = screen.getByRole('button', { name: /Novo Produto/i });
    fireEvent.click(newProductBtn);

    expect(screen.getByRole('heading', { name: /Cadastrar Novo Produto/i })).toBeInTheDocument();

    // Pressionar Escape na janela
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Cadastrar Novo Produto/i })).not.toBeInTheDocument();
    });
  });

  it('deve alternar para visualização em tabela e permitir acionar a edição', () => {
    useProductStore.setState({
      products: INITIAL_SUZANO_PRODUCTS,
      isLoading: false,
    });

    render(<CatalogPage />);

    const tableViewBtn = screen.getByRole('button', { name: /Inventário/i });
    fireEvent.click(tableViewBtn);

    expect(screen.getByRole('table')).toBeInTheDocument();

    const tableEditButtons = screen.getAllByRole('button', { name: /Atualizar/i });
    expect(tableEditButtons.length).toBeGreaterThan(0);

    fireEvent.click(tableEditButtons[0]);
    expect(screen.getByRole('heading', { name: /Atualizar Produto/i })).toBeInTheDocument();
  });
});
