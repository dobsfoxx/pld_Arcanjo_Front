import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import LoginPage from '../LoginPage';
import { renderComRouter } from '../../test/render';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogin = jest.fn();
const mockRegister = jest.fn();

jest.mock('../../contexts/useAuth', () => ({
  __esModule: true,
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Página LoginPage', () => {
  const getInputPeloLabel = (labelText: string) => {
    const label = screen.getByText(labelText);
    const wrapper = label.closest('div') ?? label.parentElement;
    const input = wrapper?.querySelector('input');
    if (!input) {
      throw new Error(`Não foi possível encontrar um <input> para o label: ${labelText}`);
    }
    return input as HTMLInputElement;
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockReset();
    mockRegister.mockReset();
    (toast as any).success.mockClear();
    (toast as any).error.mockClear();
  });

  it('inicia no modo login e permite alternar para cadastro', async () => {
    const user = userEvent.setup();
    renderComRouter(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Esqueceu sua senha?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Registre-se' }));
    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument();
    expect(screen.getByText('Nome completo')).toBeInTheDocument();
  });

  it('faz login e navega para /admin/forms quando ADMIN', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ role: 'ADMIN' });

    renderComRouter(<LoginPage />, { route: '/login' });

    await user.type(getInputPeloLabel('E-mail'), 'admin@exemplo.com');
    await user.type(getInputPeloLabel('Senha'), '12345678');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(mockLogin).toHaveBeenCalledWith('admin@exemplo.com', '12345678');
    expect((toast as any).success).toHaveBeenCalledWith('Login realizado com sucesso!');
    expect(mockNavigate).toHaveBeenCalledWith('/admin/forms');
  });

  it('faz cadastro, respeita startTrial e navega para /my-forms quando USER', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({ role: 'USER' });

    renderComRouter(<LoginPage />, { route: '/login' });

    await user.click(screen.getByRole('button', { name: 'Registre-se' }));

    await user.type(getInputPeloLabel('Nome completo'), 'João da Silva');
    await user.type(getInputPeloLabel('E-mail'), 'joao@exemplo.com');
    await user.type(getInputPeloLabel('Senha'), '12345678');

    // marca trial
    await user.click(screen.getByRole('checkbox'));

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(mockRegister).toHaveBeenCalledWith('João da Silva', 'joao@exemplo.com', '12345678', { startTrial: true });
    expect((toast as any).success).toHaveBeenCalledWith('Cadastro realizado com sucesso!');
    expect(mockNavigate).toHaveBeenCalledWith('/my-forms');
  });
});
