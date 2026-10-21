import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('deve renderizar o texto do botão corretamente', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument();
  });

  it('deve disparar evento de onClick quando clicado', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Ação</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Ação' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve desabilitar o botão e não disparar clique quando disabled for true', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Desabilitado
      </Button>
    );

    const btn = screen.getByRole('button', { name: 'Desabilitado' });
    expect(btn).toBeDisabled();

    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('deve exibir estado de loading e desabilitar o botão', () => {
    render(<Button isLoading>Salvando</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('deve aplicar variantes semânticas e tamanhos', () => {
    const { rerender } = render(<Button variant="danger">Excluir</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-rose-600');

    rerender(<Button variant="secondary" size="sm">Secundário</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-zinc-300');
    expect(screen.getByRole('button')).toHaveClass('text-xs');
  });

  it('deve renderizar ícones à esquerda e à direita', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">←</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Navegar
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
