import React from 'react';
import { renderComRouter } from '../../test/render';
import { screen } from '@testing-library/react';
import NotFoundPage from '../NotFoundPage';

let mockUser: any = null;

jest.mock('../../contexts/useAuth', () => ({
  __esModule: true,
  useAuth: () => ({ user: mockUser }),
}));

jest.mock('../../components/AppHeader', () => ({
  __esModule: true,
  default: function AppHeaderMock(props: any) {
    return (
      <header>
        <h1>{props.title}</h1>
        {props.subtitle ? <p>{props.subtitle}</p> : null}
        <span data-testid="showUserMenu">{String(!!props.showUserMenu)}</span>
      </header>
    );
  },
}));

jest.mock('../../components/AppFooter', () => ({
  __esModule: true,
  default: function AppFooterMock() {
    return <footer>Rodapé</footer>;
  },
}));

describe('Página NotFoundPage (404)', () => {
  beforeEach(() => {
    mockUser = null;
  });

  it('quando não autenticado, sugere ir para login e esconde menu do usuário', () => {
    renderComRouter(<NotFoundPage />, { route: '/rota-inexistente' });

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByText('/rota-inexistente')).toBeInTheDocument();
    expect(screen.getByTestId('showUserMenu')).toHaveTextContent('false');

    const link = screen.getByRole('link', { name: 'Ir para login' });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('quando autenticado, sugere voltar ao início e mostra menu do usuário', () => {
    mockUser = { id: '1', email: 'user@exemplo.com' };

    renderComRouter(<NotFoundPage />, { route: '/rota-inexistente' });

    expect(screen.getByTestId('showUserMenu')).toHaveTextContent('true');

    const link = screen.getByRole('link', { name: 'Voltar ao início' });
    expect(link).toHaveAttribute('href', '/');
  });
});
