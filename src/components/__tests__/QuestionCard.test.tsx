import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { QuestionCard } from '../QuestionCard';
import type { Question } from '../../types/types';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'q1',
  texto: 'Título da questão',
  aplicavel: true,
  respondida: false,
  capitulacao: '',
  criticidade: 'ALTA' as any,
  resposta: 'Sim',
  respostaTexto: '',
  respostaArquivo: [],
  deficienciaTexto: '',
  deficienciaArquivo: [],
  recomendacaoTexto: '',
  test: {
    status: 'NAO' as any,
    description: '',
    requisicao: [],
    requisicaoRef: '',
    resposta: [],
    respostaRef: '',
    amostra: [],
    amostraRef: '',
    evidencias: [],
    evidenciasRef: '',
    actionPlan: {
      origem: '',
      responsavel: '',
      descricao: '',
      dataApontamento: '',
      prazoOriginal: '',
      prazoAtual: '',
      comentarios: '',
    },
  },
  ...overrides,
});

describe('Componente QuestionCard', () => {
  beforeEach(() => {
    (toast as any).success.mockClear();
    (toast as any).error.mockClear();
    (toast as any).loading.mockClear();
  });

  it('chama onToggleExpanded ao clicar no cabeçalho', async () => {
    const user = userEvent.setup();
    const onToggleExpanded = jest.fn();

    const question = makeQuestion({ texto: 'Questão X' });

    render(
      <QuestionCard
        question={question}
        index={0}
        total={1}
        expanded={false}
        onToggleExpanded={onToggleExpanded}
        onChange={jest.fn()}
        onChangeSync={jest.fn()}
        onDelete={jest.fn()}
        onPersist={jest.fn(async () => true)}
        canEdit={true}
      />
    );

    const article = screen.getByLabelText('Questão 1: Questão X');
    const headerButton = within(article).getByRole('button', { expanded: false });

    await user.click(headerButton);
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it('botões de mover/apagar não disparam toggle (stopPropagation)', async () => {
    const user = userEvent.setup();
    const onToggleExpanded = jest.fn();
    const onMoveUp = jest.fn();
    const onDelete = jest.fn();

    render(
      <QuestionCard
        question={makeQuestion({ texto: 'Questão Y' })}
        index={0}
        total={2}
        expanded={false}
        onToggleExpanded={onToggleExpanded}
        onMoveUp={onMoveUp}
        onDelete={onDelete}
        onChange={jest.fn()}
        onChangeSync={jest.fn()}
        onPersist={jest.fn(async () => true)}
        canEdit={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Mover questão para cima' }));
    expect(onMoveUp).toHaveBeenCalledTimes(1);
    expect(onToggleExpanded).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Remover questão' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onToggleExpanded).not.toHaveBeenCalled();
  });

  it('quando expandido, lista evidências anexadas', () => {
    const file1 = new File(['a'], 'resposta.pdf', { type: 'application/pdf' });
    const file2 = new File(['b'], 'evidencia.png', { type: 'image/png' });

    render(
      <QuestionCard
        question={makeQuestion({
          texto: 'Questão Z',
          respostaArquivo: [file1],
          test: {
            ...makeQuestion().test,
            evidencias: [file2],
          },
        })}
        index={0}
        total={1}
        expanded={true}
        onToggleExpanded={jest.fn()}
        onChange={jest.fn()}
        onChangeSync={jest.fn()}
        onDelete={jest.fn()}
        onPersist={jest.fn(async () => true)}
        canEdit={true}
      />
    );

    const summary = screen.getByText('Evidências anexadas').closest('div');
    expect(summary).toBeTruthy();
    const scoped = within(summary as HTMLElement);

    expect(scoped.getByText(/Resposta \(1\):/)).toBeInTheDocument();
    expect(scoped.getByText('resposta.pdf')).toBeInTheDocument();
    expect(scoped.getByText(/Evidências \(1\):/)).toBeInTheDocument();
    expect(scoped.getByText('evidencia.png')).toBeInTheDocument();
  });

  it('salva resposta quando válido e canEdit=true', async () => {
    const user = userEvent.setup();
    const onPersist = jest.fn(async () => true);
    const onChange = jest.fn();

    render(
      <QuestionCard
        question={makeQuestion({ texto: 'Questão Salvável' })}
        index={0}
        total={1}
        expanded={true}
        onToggleExpanded={jest.fn()}
        onChange={onChange}
        onChangeSync={jest.fn()}
        onDelete={jest.fn()}
        onPersist={onPersist}
        canEdit={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Salvar resposta da questão' }));

    expect((toast as any).loading).toHaveBeenCalledWith('Salvando...', { id: 'pld-save-q1' });
    expect(onPersist).toHaveBeenCalledTimes(1);
    expect((toast as any).success).toHaveBeenCalledWith('Resposta salva', { id: 'pld-save-q1' });

    // O componente marca como respondida ao salvar com sucesso
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ respondida: true }));
  });

  it('quando canEdit=false, botão salvar fica desabilitado e com title de permissão', () => {
    render(
      <QuestionCard
        question={makeQuestion({ texto: 'Questão Sem Permissão' })}
        index={0}
        total={1}
        expanded={true}
        onToggleExpanded={jest.fn()}
        onChange={jest.fn()}
        onChangeSync={jest.fn()}
        onDelete={jest.fn()}
        onPersist={jest.fn(async () => true)}
        canEdit={false}
      />
    );

    const btn = screen.getByRole('button', { name: 'Salvar resposta da questão' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Apenas ADMIN pode salvar');
  });
});
