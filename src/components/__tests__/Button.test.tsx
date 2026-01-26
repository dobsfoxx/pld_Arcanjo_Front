import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Componente Button', () => {
  it('renderiza o texto do botão', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('fica desabilitado quando a prop disabled é true', () => {
    render(<Button disabled>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it('fica desabilitado e com aria-busy quando loading é true', () => {
    render(<Button loading>Salvar</Button>);
    const botao = screen.getByRole('button', { name: 'Salvar' });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute('aria-busy', 'true');
  });

  it('renderiza um ícone à esquerda quando leftIcon é informado', () => {
    render(<Button leftIcon={<span data-testid="icone-esquerda" />}>Salvar</Button>);
    expect(screen.getByTestId('icone-esquerda')).toBeInTheDocument();
  });

  it('renderiza um ícone à direita quando rightIcon é informado', () => {
    render(<Button rightIcon={<span data-testid="icone-direita" />}>Salvar</Button>);
    expect(screen.getByTestId('icone-direita')).toBeInTheDocument();
  });

  it('não renderiza os ícones quando loading é true', () => {
    render(
      <Button
        loading
        leftIcon={<span data-testid="icone-esquerda" />}
        rightIcon={<span data-testid="icone-direita" />}
      >
        Salvar
      </Button>
    );

    expect(screen.queryByTestId('icone-esquerda')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icone-direita')).not.toBeInTheDocument();
  });
});
