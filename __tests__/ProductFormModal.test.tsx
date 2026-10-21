import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFormModal, productSchema } from '@/components/ProductFormModal';
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

    // Deve ter adicionado na store com a quantidade de estoque definida
    const products = useProductStore.getState().products;
    const addedProduct = products.find((p) => p.name === 'Papel Tissue Premium Ecofibra');
    expect(addedProduct).toBeDefined();
    expect(addedProduct?.stockQuantity).toBe(15);
  });

  it('deve permitir definir quantidade em estoque personalizada no cadastro', async () => {
    const user = userEvent.setup();
    render(<ProductFormModal isOpen={true} onClose={onCloseMock} />);

    await user.type(screen.getByLabelText(/Nome do Produto/i), 'Válvula Esfera Industrial');
    await user.type(screen.getByLabelText(/Preço Unitário/i), '850');
    await user.type(screen.getByLabelText(/URL da Imagem/i), 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d');
    await user.type(screen.getByLabelText(/Descrição Detalhada/i), 'Válvula esfera com corpo em aço inoxidável 316.');

    const stockInput = screen.getByLabelText(/Estoque Operacional/i);
    await user.clear(stockInput);
    await user.type(stockInput, '45');

    const submitButton = screen.getByRole('button', { name: /Salvar Produto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cadastrado com sucesso!/i)).toBeInTheDocument();
    });

    const products = useProductStore.getState().products;
    const addedProduct = products.find((p) => p.name === 'Válvula Esfera Industrial');
    expect(addedProduct).toBeDefined();
    expect(addedProduct?.stockQuantity).toBe(45);
    expect(addedProduct?.inStock).toBe(true);
  });

  it('deve preencher os campos e atualizar o produto quando productToEdit for fornecido', async () => {
    const user = userEvent.setup();
    const existingProduct = {
      id: 'suz-001',
      name: 'Bobina Kraft Inicial',
      category: 'Embalagens e Papelcartão' as const,
      price: 2100,
      description: 'Bobina de alta resistência para embalagens.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
      sku: 'KRF-001',
      unit: 'Bobina 400kg',
      stockQuantity: 18,
      inStock: true,
    };

    useProductStore.setState({ products: [existingProduct] });

    render(
      <ProductFormModal
        isOpen={true}
        onClose={onCloseMock}
        productToEdit={existingProduct}
      />
    );

    expect(screen.getByRole('heading', { name: /Atualizar Produto/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bobina Kraft Inicial')).toBeInTheDocument();
    expect(screen.getByDisplayValue('KRF-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('18')).toBeInTheDocument();

    const priceInput = screen.getByLabelText(/Preço Unitário/i);
    await user.clear(priceInput);
    await user.type(priceInput, '2450');

    const submitButton = screen.getByRole('button', { name: /Salvar Alterações/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/atualizado com sucesso!/i)).toBeInTheDocument();
    });
  });

  it('deve fechar o modal ao pressionar a tecla Escape', async () => {
    const user = userEvent.setup();
    render(<ProductFormModal isOpen={true} onClose={onCloseMock} />);

    await user.keyboard('{Escape}');
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('deve exibir mensagem de erro quando o salvamento falhar', async () => {
    const user = userEvent.setup();
    jest.spyOn(useProductStore.getState(), 'addProduct').mockRejectedValueOnce(
      new Error('Erro de persistência no backend')
    );

    render(<ProductFormModal isOpen={true} onClose={onCloseMock} />);

    await user.type(screen.getByLabelText(/Nome do Produto/i), 'Produto com Erro');
    await user.type(screen.getByLabelText(/Preço Unitário/i), '500');
    await user.type(screen.getByLabelText(/URL da Imagem/i), 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d');
    await user.type(screen.getByLabelText(/Descrição Detalhada/i), 'Descrição com mais de 10 caracteres.');

    const submitButton = screen.getByRole('button', { name: /Salvar Produto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Erro de persistência no backend')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de erro genérica quando a rejeição não for uma instância de Error', async () => {
    const user = userEvent.setup();
    jest.spyOn(useProductStore.getState(), 'addProduct').mockRejectedValueOnce('string error');

    render(<ProductFormModal isOpen={true} onClose={onCloseMock} />);

    await user.type(screen.getByLabelText(/Nome do Produto/i), 'Produto Rejeição String');
    await user.type(screen.getByLabelText(/Preço Unitário/i), '600');
    await user.type(screen.getByLabelText(/URL da Imagem/i), 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d');
    await user.type(screen.getByLabelText(/Descrição Detalhada/i), 'Descrição com mais de 10 caracteres.');

    const submitButton = screen.getByRole('button', { name: /Salvar Produto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Falha ao processar produto')).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.queryByText('Falha ao processar produto')).not.toBeInTheDocument();
      },
      { timeout: 4500 }
    );
  });

  it('deve disparar erro de validação para estoque negativo e URL inválida', async () => {
    const user = userEvent.setup();
    render(<ProductFormModal isOpen={true} onClose={onCloseMock} />);

    await user.type(screen.getByLabelText(/Nome do Produto/i), 'Produto Teste Negativo');
    await user.type(screen.getByLabelText(/Preço Unitário/i), '150');
    await user.clear(screen.getByLabelText(/Estoque Operacional/i));
    await user.type(screen.getByLabelText(/Estoque Operacional/i), '-5');
    await user.type(screen.getByLabelText(/URL da Imagem/i), 'ftp://invalido.com');
    await user.type(screen.getByLabelText(/Descrição Detalhada/i), 'Descrição válida com mais de 10 caracteres.');

    const submitButton = screen.getByRole('button', { name: /Salvar Produto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/A quantidade em estoque não pode ser negativa/i)).toBeInTheDocument();
      expect(screen.getByText(/A URL deve iniciar com http:\/\/ ou https:\/\//i)).toBeInTheDocument();
    });
  });

  it('deve preencher valores padrão quando productToEdit possuir campos opcionais nulos ou indefinidos', () => {
    const partialProduct = {
      id: 'suz-partial',
      name: 'Produto Parcial',
      category: 'Celulose' as const,
      price: 1500,
      description: 'Descrição suficiente para o formulário.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
      inStock: false,
    };

    render(
      <ProductFormModal
        isOpen={true}
        onClose={onCloseMock}
        productToEdit={partialProduct}
      />
    );

    expect(screen.getByDisplayValue('Produto Parcial')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // Estoque padrão quando não definido
  });

  it('deve validar corretamente regras adicionais do productSchema e Error.prototype', () => {
    // Validação de estoque vazio/nulo se transformando em 0
    const parsed = productSchema.parse({
      name: 'Produto Zod Test',
      category: 'Celulose',
      price: 100,
      stockQuantity: '',
      description: 'Mais de dez caracteres no texto',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
    });
    expect(parsed.stockQuantity).toBe(0);

    // Testar o getter em Error.prototype.errors
    const testErr = Object.assign(new Error('Teste'), { issues: [{ message: 'issue test' }] });
    expect((testErr as unknown as { errors: unknown[] }).errors).toEqual([{ message: 'issue test' }]);
  });
});
