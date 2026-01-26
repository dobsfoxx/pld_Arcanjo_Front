import React from 'react';
import { render, screen } from '@testing-library/react';
import AppHeader from '../AppHeader';

jest.mock('../UserMenu', () => ({
  __esModule: true,
  default: function UserMenuMock() {
    return <div data-testid="menu-usuario">Menu do usuário</div>;
  },
}));

describe('Componente AppHeader', () => {
  it('renderiza título e subtítulo quando informado', () => {
    render(<AppHeader title="Painel" subtitle="Subtítulo" />);

    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
  });

  it('não renderiza subtítulo quando não informado', () => {
    render(<AppHeader title="Painel" />);
    expect(screen.queryByText('Subtítulo')).not.toBeInTheDocument();
  });

  it('renderiza o conteúdo de leading e actions', () => {
    render(
      <AppHeader
        title="Painel"
        leading={<div data-testid="leading">Leading</div>}
        actions={<button type="button">Ação</button>}
      />
    );

    expect(screen.getByTestId('leading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument();
  });

  it('mostra o menu do usuário por padrão', () => {
    render(<AppHeader title="Painel" />);
    expect(screen.getByTestId('menu-usuario')).toBeInTheDocument();
  });

  it('esconde o menu do usuário quando showUserMenu é false', () => {
    render(<AppHeader title="Painel" showUserMenu={false} />);
    expect(screen.queryByTestId('menu-usuario')).not.toBeInTheDocument();
  });
});
