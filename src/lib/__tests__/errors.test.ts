import { getToastErrorMessage } from '../errors';

describe('Utilitário getToastErrorMessage', () => {
  it('retorna fallback quando erro é vazio ou não reconhecido', () => {
    expect(getToastErrorMessage(null as any, 'Fallback')).toBe('Fallback');
    expect(getToastErrorMessage(undefined as any, 'Fallback')).toBe('Fallback');
  });

  it('retorna a primeira linha de uma string', () => {
    expect(getToastErrorMessage('Mensagem\nDetalhe', 'Fallback')).toBe('Mensagem');
  });

  it('protege contra mensagens sensíveis/internas (caminho Windows)', () => {
    expect(getToastErrorMessage(new Error('C:\\src\\segredo.txt'), 'Fallback')).toBe('Erro interno do servidor');
  });

  it('limita tamanho e adiciona reticências quando muito grande', () => {
    const grande = 'A'.repeat(500);
    const msg = getToastErrorMessage(grande, 'Fallback');
    expect(msg.length).toBeLessThanOrEqual(181);
  });
});
