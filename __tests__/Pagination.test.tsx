import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/Pagination';
import { useProductStore } from '@/store/useProductStore';
import { INITIAL_SUZANO_PRODUCTS } from '@/services/mockData';

describe('Pagination Component', () => {
  beforeEach(() => {
    // Reseta store com produtos de teste
    useProductStore.setState({
      products: INITIAL_SUZANO_PRODUCTS,
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
    });
  });

  it('não deve renderizar nada quando total de itens for 0', () => {
    useProductStore.setState({ products: [] });
    const { container } = render(<Pagination />);
    expect(container).toBeEmptyDOMElement();
  });

  it('deve renderizar controles básicos de paginação e indicador de itens', () => {
    render(<Pagination />);

    expect(screen.getByRole('navigation', { name: /Paginação de produtos/i })).toBeInTheDocument();
    expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exibir:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ir para a página anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Ir para a próxima página/i })).toBeEnabled();
  });

  it('deve navegar para a próxima página e página anterior ao clicar nos botões', () => {
    render(<Pagination />);

    const nextButton = screen.getByRole('button', { name: /Ir para a próxima página/i });
    fireEvent.click(nextButton);
    expect(useProductStore.getState().currentPage).toBe(2);

    const prevButton = screen.getByRole('button', { name: /Ir para a página anterior/i });
    fireEvent.click(prevButton);
    expect(useProductStore.getState().currentPage).toBe(1);
  });

  it('deve navegar diretamente para a página ao clicar no botão numérico', () => {
    render(<Pagination />);

    const page2Button = screen.getByRole('button', { name: /Ir para a página 2/i });
    fireEvent.click(page2Button);
    expect(useProductStore.getState().currentPage).toBe(2);
  });

  it('deve alterar o pageSize ao mudar o select', () => {
    render(<Pagination />);

    const select = screen.getByLabelText(/Exibir:/i);
    fireEvent.change(select, { target: { value: '12' } });
    expect(useProductStore.getState().pageSize).toBe(12);
  });

  it('deve exibir elipses quando houver mais de 7 páginas', () => {
    // Cria 50 produtos fictícios para gerar > 8 páginas com pageSize 6
    const manyProducts = Array.from({ length: 60 }, (_, i) => ({
      ...INITIAL_SUZANO_PRODUCTS[0],
      id: `prod-${i}`,
      name: `Produto ${i}`,
    }));

    useProductStore.setState({
      products: manyProducts,
      pageSize: 6,
      currentPage: 5,
    });

    render(<Pagination />);

    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('deve exibir elipse à direita quando na primeira página de muitas páginas', () => {
    const manyProducts = Array.from({ length: 60 }, (_, i) => ({
      ...INITIAL_SUZANO_PRODUCTS[0],
      id: `prod-right-${i}`,
      name: `Produto ${i}`,
    }));

    useProductStore.setState({
      products: manyProducts,
      pageSize: 6,
      currentPage: 1,
    });

    render(<Pagination />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('deve desabilitar botão próximo quando estiver na última página', () => {
    useProductStore.setState({
      products: INITIAL_SUZANO_PRODUCTS,
      pageSize: 6,
      currentPage: 2,
    });

    render(<Pagination />);
    const nextButton = screen.getByRole('button', { name: /Ir para a próxima página/i });
    expect(nextButton).toBeDisabled();
  });
});
