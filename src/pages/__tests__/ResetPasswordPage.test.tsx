import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import ResetPasswordPage from '../ResetPasswordPage';

const mockNavigate = jest.fn();
let mockToken = 'token-valido';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(mockToken ? `token=${mockToken}` : ''), jest.fn()],
  };
});

const mockResetPassword = jest.fn();

jest.mock('../../lib/api', () => {
  return {
    authApi: {
      resetPassword: (...args: any[]) => mockResetPassword(...args),
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

describe('Página ResetPasswordPage', () => {
  function getInputPeloLabel(textoDoLabel: string) {
    const label = screen.getByText(textoDoLabel);
    const container = label.parentElement;
    const input = container?.querySelector('input');
    if (!input) throw new Error(`Input não encontrado para o label: ${textoDoLabel}`);
    return input as HTMLInputElement;
  }

  beforeEach(() => {
    mockNavigate.mockClear();
    mockResetPassword.mockReset();
    (toast as any).success.mockClear();
    (toast as any).error.mockClear();
    mockToken = 'token-valido';
  });

  it('bloqueia submissão quando token está ausente', async () => {
    mockToken = '';
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(getInputPeloLabel('Nova senha'), '12345678');
    await user.type(getInputPeloLabel('Confirmar nova senha'), '12345678');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect((toast as any).error).toHaveBeenCalledWith('Token de recuperação inválido. Use o link enviado por e-mail.');
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('valida tamanho mínimo da senha', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(getInputPeloLabel('Nova senha'), '123');
    await user.type(getInputPeloLabel('Confirmar nova senha'), '123');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect((toast as any).error).toHaveBeenCalledWith('A senha deve ter pelo menos 8 caracteres.');
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('valida confirmação de senha', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(getInputPeloLabel('Nova senha'), '12345678');
    await user.type(getInputPeloLabel('Confirmar nova senha'), '87654321');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect((toast as any).error).toHaveBeenCalledWith('As senhas não conferem.');
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('chama a API, mostra sucesso e redireciona quando válido', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValueOnce({ data: { message: 'ok' } });

    render(<ResetPasswordPage />);

    await user.type(getInputPeloLabel('Nova senha'), '12345678');
    await user.type(getInputPeloLabel('Confirmar nova senha'), '12345678');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(mockResetPassword).toHaveBeenCalledWith({ token: 'token-valido', password: '12345678' });
    expect((toast as any).success).toHaveBeenCalledWith('Senha redefinida com sucesso. Faça login com a nova senha.');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('mostra erro quando API falha', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockRejectedValueOnce(new Error('falha'));

    render(<ResetPasswordPage />);

    await user.type(getInputPeloLabel('Nova senha'), '12345678');
    await user.type(getInputPeloLabel('Confirmar nova senha'), '12345678');
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect((toast as any).error).toHaveBeenCalledWith('Erro ao redefinir senha. O link pode estar expirado.');
  });
});
