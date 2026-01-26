import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import ForgotPasswordPage from '../ForgotPasswordPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockForgotPassword = jest.fn();

jest.mock('../../lib/api', () => {
  return {
    authApi: {
      forgotPassword: (...args: any[]) => mockForgotPassword(...args),
    },
  };
});

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../components/AppHeader', () => ({
  __esModule: true,
  default: function AppHeaderMock() {
    return <header>Header</header>;
  },
}));

jest.mock('../../components/AppFooter', () => ({
  __esModule: true,
  default: function AppFooterMock() {
    return <footer>Footer</footer>;
  },
}));

describe('Página ForgotPasswordPage', () => {
  function getInputPeloLabel(textoDoLabel: string) {
    const label = screen.getByText(textoDoLabel);
    const container = label.parentElement;
    const input = container?.querySelector('input');
    if (!input) throw new Error(`Input não encontrado para o label: ${textoDoLabel}`);
    return input as HTMLInputElement;
  }

  beforeEach(() => {
    mockNavigate.mockClear();
    mockForgotPassword.mockReset();
    (toast as any).success.mockClear();
    (toast as any).error.mockClear();
  });

  it('envia e-mail de recuperação e redireciona para login quando sucesso', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValueOnce({ data: { message: 'ok' } });

    render(<ForgotPasswordPage />);

    await user.type(getInputPeloLabel('E-mail'), 'teste@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }));

    expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'teste@exemplo.com' });
    expect((toast as any).success).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('mostra toast de erro quando a API falha', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockRejectedValueOnce(new Error('falha'));

    render(<ForgotPasswordPage />);

    await user.type(getInputPeloLabel('E-mail'), 'teste@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }));

    expect((toast as any).error).toHaveBeenCalledWith('Erro ao solicitar recuperação de senha');
  });
});
