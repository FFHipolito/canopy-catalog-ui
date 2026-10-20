import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductTableView } from '@/components/ProductTableView';
import { Product } from '@/types/product';

const mockTableProducts: Product[] = [
  {
    id: 'suz-tab-01',
    name: 'Polpa Celulose Kraft Branqueada',
    category: 'Celulose',
    price: 3850,
    description: 'Celulose de alta maciez.',
    imageUrl: 'https://example.com/cel.jpg',
    sku: 'CEL-KRAFT-01',
    stockQuantity: 25,
    unit: 'Fardo 1.000 kg',
    inStock: true,
  },
  {
    id: 'suz-tab-02',
    name: 'Sensor IoT de Temperatura',
    category: 'Bioprodutos e Inovação',
    price: 1650,
    description: 'Sensor industrial.',
    imageUrl: 'https://example.com/iot.jpg',
    sku: 'IOT-TEMP-02',
    stockQuantity: 0,
    unit: 'Unidade',
    inStock: false,
  },
];

describe('ProductTableView Component', () => {
  it('deve renderizar a tabela com cabeçalhos e produtos listados', () => {
    render(<ProductTableView products={mockTableProducts} />);

    // Cabeçalhos
    expect(screen.getByRole('columnheader', { name: /SKU/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Produto/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Categoria/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Preço/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Estoque/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Ações/i })).toBeInTheDocument();

    // Dados das linhas
    expect(screen.getByText('CEL-KRAFT-01')).toBeInTheDocument();
    expect(screen.getByText('Polpa Celulose Kraft Branqueada')).toBeInTheDocument();
    expect(screen.getByText('Celulose')).toBeInTheDocument();
    expect(screen.getByText(/3\.850,00/)).toBeInTheDocument();
    expect(screen.getByText('Disponível')).toBeInTheDocument();

    // Produto esgotado
    expect(screen.getByText('IOT-TEMP-02')).toBeInTheDocument();
    expect(screen.getByText('Sensor IoT de Temperatura')).toBeInTheDocument();
    expect(screen.getByText('Esgotado')).toBeInTheDocument();
  });

  it('deve disparar onEdit quando o botão de Atualizar for clicado', () => {
    const onEditMock = jest.fn();
    render(<ProductTableView products={mockTableProducts} onEdit={onEditMock} />);

    const updateButtons = screen.getAllByRole('button', { name: /Atualizar/i });
    expect(updateButtons.length).toBeGreaterThan(0);

    fireEvent.click(updateButtons[0]);
    expect(onEditMock).toHaveBeenCalledTimes(1);
    expect(onEditMock).toHaveBeenCalledWith(mockTableProducts[0]);
  });
});
