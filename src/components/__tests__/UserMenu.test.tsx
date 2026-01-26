import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from '../UserMenu';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogout = jest.fn();

jest.mock('../../contexts/useAuth', () => ({
  __esModule: true,
  useAuth: () => ({
    user: {
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
      role: 'USER',
      subscriptionStatus: 'INACTIVE',
    },
    logout: mockLogout,
  }),
}));

describe('Componente UserMenu', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockClear();
  });

  it('exibe o nome do usuário no botão', () => {
    render(<UserMenu />);
    expect(screen.getByRole('button', { name: /Maria Silva/i })).toBeInTheDocument();
  });

  it('abre o menu ao clicar e navega para Perfil', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Perfil' }));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('mostra a opção "Fazer upgrade" quando não é ADMIN e assinatura não está ativa', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('menuitem', { name: 'Fazer upgrade' })).toBeInTheDocument();
  });

  it('faz logout e navega para /login ao clicar em Sair', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('menuitem', { name: 'Sair' }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
