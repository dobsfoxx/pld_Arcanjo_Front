import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { pldBuilderApi } from '../../lib/api';
import { renderComRouter } from '../../test/render';
import PLDBuilderPage from '../PLDBuilderPage';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

const mockUseAuth = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUsePldCatalog = jest.fn();
jest.mock('../../contexts/usePldCatalog', () => ({
  usePldCatalog: () => mockUsePldCatalog(),
}));

jest.mock('../../lib/api', () => ({
  pldBuilderApi: {
    listSections: jest.fn(),
    resetBuilder: jest.fn(),
    createSection: jest.fn(),
    updateSection: jest.fn(),
    deleteSection: jest.fn(),
    reorderSections: jest.fn(),
    uploadNorma: jest.fn(),
    createQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    reorderQuestions: jest.fn(),
    uploadAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
    concludeBuilder: jest.fn(),
    listConcludedForms: jest.fn(),
    listMyForms: jest.fn(),
    getConcludedForm: jest.fn(),
    deleteForm: jest.fn(),
    sendFormToUser: jest.fn(),
    getUserForm: jest.fn(),
    saveUserFormResponses: jest.fn(),
    completeUserForm: jest.fn(),
    uploadUserFormAttachment: jest.fn(),
  },
  reportApi: {},
  api: {},
}));

function setupCryptoRandomUUID() {
  const anyGlobal = globalThis as any;
  if (!anyGlobal.crypto) anyGlobal.crypto = {};

  let counter = 0;
  anyGlobal.crypto.randomUUID = () => {
    counter += 1;
    return `uuid-${counter}`;
  };
}

describe('Página PLDBuilderPage - adicionar item e criação de perguntas', () => {
  beforeAll(() => {
    setupCryptoRandomUUID();
  });

  beforeEach(() => {
    jest.useFakeTimers();
    (toast as any).success.mockClear();
    (toast as any).error.mockClear();
    (toast as any).loading.mockClear();

    mockUsePldCatalog.mockReturnValue({
      itemOptions: ['Política (PI)'],
    });

    (pldBuilderApi as any).listSections.mockResolvedValue({ data: { sections: [] } });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('adiciona um novo item (seção) ao clicar em "Adicionar novo item"', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN', subscriptionStatus: 'ACTIVE' },
      logout: jest.fn(),
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComRouter(<PLDBuilderPage />);

    await screen.findByText('Questões');

    const nav = screen.getByRole('navigation', { name: 'Navegação de itens avaliados' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(1);

    await user.click(within(nav).getByRole('button', { name: 'Adicionar novo item' }));

    expect(within(nav).getAllByRole('listitem')).toHaveLength(2);
    expect(within(nav).getAllByRole('button', { current: 'page' })).toHaveLength(1);
  });

  it('fluxo: ao clicar em "Adicionar questão", cria a primeira questão expandida', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN', subscriptionStatus: 'ACTIVE' },
      logout: jest.fn(),
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComRouter(<PLDBuilderPage />);

    await screen.findByText('Nenhuma questão adicionada');

    await user.click(screen.getByRole('button', { name: 'Adicionar questão' }));

    expect(screen.getByLabelText('Questão 1: Sem título')).toBeInTheDocument();
    expect(screen.getByText('Título da Questão')).toBeInTheDocument();

    // estado muda: agora existe o botão para adicionar mais questões
    await user.click(screen.getByRole('button', { name: 'Adicionar nova questão' }));

    expect(screen.getByLabelText('Questão 2: Sem título')).toBeInTheDocument();
  });

  it('no modo TRIAL, respeita limite de 3 questões e desabilita o botão', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        role: 'TRIAL_ADMIN',
        subscriptionStatus: 'INACTIVE',
        trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      logout: jest.fn(),
    });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComRouter(<PLDBuilderPage />);

    await screen.findByText('Nenhuma questão adicionada');

    await user.click(screen.getByRole('button', { name: 'Adicionar questão' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar nova questão' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar nova questão' }));

    expect(screen.getByLabelText('Questão 3: Sem título')).toBeInTheDocument();

    const addMore = screen.getByRole('button', { name: 'Adicionar nova questão' });
    expect(addMore).toBeDisabled();
    expect(addMore).toHaveAttribute('title', 'Limite do modo teste (3) atingido');
  });

  it('ao persistir, cria seção e questão quando ids são temporários', async () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'ADMIN', subscriptionStatus: 'ACTIVE' },
      logout: jest.fn(),
    });

    (pldBuilderApi as any).createSection.mockResolvedValue({
      data: { section: { id: 'sec-remote-1' } },
    });
    (pldBuilderApi as any).createQuestion.mockResolvedValue({
      data: { question: { id: 'q-remote-1' } },
    });
    (pldBuilderApi as any).updateQuestion.mockResolvedValue({ data: { question: {} } });

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComRouter(<PLDBuilderPage />);

    await screen.findByText('Nenhuma questão adicionada');

    await user.click(screen.getByRole('button', { name: 'Adicionar questão' }));

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect((pldBuilderApi as any).createSection).toHaveBeenCalledTimes(1);
      expect((pldBuilderApi as any).createQuestion).toHaveBeenCalledTimes(1);
      expect((pldBuilderApi as any).updateQuestion).toHaveBeenCalledTimes(1);
    });
  });
});
