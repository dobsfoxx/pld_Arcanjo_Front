import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionSidebar } from '../SectionSidebar';
import type { Section, Question } from '../../types/types';

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: 'q1',
  texto: 'Questão 1',
  aplicavel: true,
  respondida: false,
  capitulacao: '',
  criticidade: 'ALTA' as any,
  resposta: '',
  respostaTexto: '',
  respostaArquivo: [],
  deficienciaTexto: '',
  deficienciaArquivo: [],
  recomendacaoTexto: '',
  test: {
    status: '' as any,
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

const makeSection = (id: string, item: string, questionsCount: number): Section => ({
  id,
  item,
  customLabel: '',
  hasNorma: false,
  normaFile: [],
  descricao: '',
  questions: Array.from({ length: questionsCount }, (_, idx) => makeQuestion({ id: `${id}-q${idx + 1}` })),
});

describe('Componente SectionSidebar', () => {
  it('renderiza lista, indica seção ativa e chama onSelect ao clicar', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    const sections = [makeSection('s1', 'Item 1', 2), makeSection('s2', 'Item 2', 5)];

    render(
      <SectionSidebar
        sections={sections}
        activeId="s1"
        onSelect={onSelect}
        onAdd={jest.fn()}
        canEdit={true}
      />
    );

    const item1 = screen.getByRole('button', { name: 'Item 1 - 2 questões' });
    const item2 = screen.getByRole('button', { name: 'Item 2 - 5 questões' });

    expect(item1).toHaveAttribute('aria-current', 'page');
    expect(item2).not.toHaveAttribute('aria-current');

    await user.click(item2);
    expect(onSelect).toHaveBeenCalledWith('s2');
  });

  it('mostra botão de apagar apenas quando canEdit e onDelete existem', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();

    const sections = [makeSection('s1', 'Item 1', 1)];

    render(
      <SectionSidebar
        sections={sections}
        activeId="s1"
        onSelect={jest.fn()}
        onDelete={onDelete}
        onAdd={jest.fn()}
        canEdit={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Apagar item avaliado Item 1' }));
    expect(onDelete).toHaveBeenCalledWith('s1');
  });

  it('desabilita o botão de adicionar quando não pode editar', () => {
    const sections = [makeSection('s1', 'Item 1', 1)];

    render(
      <SectionSidebar
        sections={sections}
        activeId="s1"
        onSelect={jest.fn()}
        onAdd={jest.fn()}
        canEdit={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Adicionar novo item' })).toBeDisabled();
  });

  it('respeita canAdd=false mesmo com canEdit=true', () => {
    const sections = [makeSection('s1', 'Item 1', 1)];

    render(
      <SectionSidebar
        sections={sections}
        activeId="s1"
        onSelect={jest.fn()}
        onAdd={jest.fn()}
        canEdit={true}
        canAdd={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Adicionar novo item' })).toBeDisabled();
  });

  it('chama onAdd ao clicar em "Adicionar item" quando habilitado', async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();

    const sections = [makeSection('s1', 'Item 1', 0)];

    render(
      <SectionSidebar
        sections={sections}
        activeId="s1"
        onSelect={jest.fn()}
        onAdd={onAdd}
        canEdit={true}
        canAdd={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar novo item' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
