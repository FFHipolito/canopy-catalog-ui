import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFormModal } from '@/components/ProductFormModal';
import { useProductStore } from '@/store/useProductStore';

describe('ProductFormModal Component', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não deve renderizar quando isOpen for false', () => {
    render(<ProductFormModal isOpen={false} onClose={onCloseMock} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // Requisito obrigatório: Validação disparando erro ao tentar salvar formulário em branco
  it('deve disparar erros de validação Zod ao tentar submeter o formulário em branco', async () => {
    const user = userEvent.setup();
    render(<ProductFormModal isOpen={true} onClose={onCloseMock} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /Salvar Produto/i });
    await user.click(submitButton);

    // Validação do campo Nome
    await waitFor(() => {
      expect(
        screen.getByText('O nome do produto deve ter no mínimo 3 caracteres')
      ).toBeInTheDocument();
    });

    // Validação do campo Preço
    expect(screen.getByText('Informe um preço válido')).toBeInTheDocument();

    // Validação da URL da Imagem
    expect(
      screen.getByText('Informe uma URL de imagem válida (ex: https://...)')
    ).toBeInTheDocument();

    // Validação da Descrição
    expect(
      screen.getByText('A descrição deve ter no mínimo 10 caracteres')
    ).toBeInTheDocument();
  });

  it('deve disparar erro de validação para preço negativo ou zero', async () => {
    const user = userEvent.setup();
    render(<ProductFormModal isOpen={true} onClose={onCloseMock} />);

    const priceInput = screen.getByLabelText(/Preço Unitário/i);
    await user.type(priceInput, '-150');

    const submitButton = screen.getByRole('button', { name: /Salvar Produto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('O preço deve ser maior que zero (R$ 0,00)')
      ).toBeInTheDocument();
    });
  });

  it('deve submeter com sucesso quando todos os campos obrigatórios forem preenchidos', async () => {
    const user = userEvent.setup();
    render(<ProductFormModal isOpen={true} onClose={onCloseMock} />);

    // Preenche o campo Nome
    await user.type(
      screen.getByLabelText(/Nome do Produto/i),
      'Papel Tissue Premium Ecofibra'
    );

    // Preenche o campo Preço
    await user.type(screen.getByLabelText(/Preço Unitário/i), '1250');

    // Preenche a URL da Imagem
    await user.type(
      screen.getByLabelText(/URL da Imagem/i),
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d'
    );

    // Preenche a Descrição
    await user.type(
      screen.getByLabelText(/Descrição Detalhada/i),
      'Produto fabricado com celulose 100% renovável e alta maciez.'
    );

    const submitButton = screen.getByRole('button', { name: /Salvar Produto/i });
    await user.click(submitButton);

    // Deve exibir toast de sucesso
    await waitFor(() => {
      expect(
        screen.getByText(/cadastrado com sucesso!/i)
      ).toBeInTheDocument();
    });

    // Deve ter adicionado na store
    const products = useProductStore.getState().products;
    expect(
      products.some((p) => p.name === 'Papel Tissue Premium Ecofibra')
    ).toBe(true);
  });
});
