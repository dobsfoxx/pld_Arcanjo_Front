import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../FileUpload';

describe('Componente FileUpload', () => {
  it('mostra asterisco de obrigatório quando required e sem arquivo', () => {
    render(<FileUpload label="Documento" required />);

    expect(screen.getByText('Documento')).toBeInTheDocument();
    expect(screen.getByLabelText('obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Clique ou arraste para selecionar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /documento/i })).toBeInTheDocument();
  });

  it('chama onFileSelect ao selecionar um arquivo (modo único)', async () => {
    const user = userEvent.setup();
    const onFileSelect = jest.fn();

    render(<FileUpload label="Documento" onFileSelect={onFileSelect} />);

    const input = screen.getByLabelText('Documento', { selector: 'input' }) as HTMLInputElement;
    const file = new File(['conteudo'], 'arquivo.pdf', { type: 'application/pdf' });

    await user.upload(input, file);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('renderiza arquivo selecionado e chama onRemove ao remover (modo único)', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();

    const file = new File(['x'], 'contrato.pdf', { type: 'application/pdf' });

    render(<FileUpload label="Documento" file={file} onRemove={onRemove} />);

    expect(screen.getByText('contrato.pdf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remover arquivo contrato.pdf' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('no modo múltiplo agrega e limita arquivos via maxFiles', async () => {
    const user = userEvent.setup();
    const onFilesSelect = jest.fn();

    const initial = [
      new File(['1'], 'a.pdf', { type: 'application/pdf' }),
      new File(['2'], 'b.pdf', { type: 'application/pdf' }),
    ];

    render(
      <FileUpload
        label="Evidências"
        multiple
        files={initial}
        maxFiles={3}
        onFilesSelect={onFilesSelect}
      />
    );

    const input = screen.getByLabelText('Evidências', { selector: 'input' }) as HTMLInputElement;
    const extra1 = new File(['3'], 'c.pdf', { type: 'application/pdf' });
    const extra2 = new File(['4'], 'd.pdf', { type: 'application/pdf' });

    // Upload de dois arquivos, mas maxFiles=3: deve truncar
    await user.upload(input, [extra1, extra2]);

    expect(onFilesSelect).toHaveBeenCalledTimes(1);
    const next = onFilesSelect.mock.calls[0][0] as File[];
    expect(next.map((f) => f.name)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
  });

  it('no modo múltiplo chama onRemoveAt com o índice correto', async () => {
    const user = userEvent.setup();
    const onRemoveAt = jest.fn();

    const files = [
      new File(['1'], 'a.pdf', { type: 'application/pdf' }),
      new File(['2'], 'b.pdf', { type: 'application/pdf' }),
    ];

    render(
      <FileUpload
        label="Evidências"
        multiple
        files={files}
        onRemoveAt={onRemoveAt}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Remover arquivo b.pdf' }));
    expect(onRemoveAt).toHaveBeenCalledWith(1);
  });
});
