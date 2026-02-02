import React, { useRef, useId } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  file?: File | null | undefined;
  files?: File[] | null | undefined;
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  onRemove?: () => void;
  onRemoveAt?: (index: number) => void;
  accept?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  file,
  files,
  onFileSelect,
  onFilesSelect,
  onRemove,
  onRemoveAt,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.mp4,.txt,.jpg,.jpeg,.png,.gif',
  required = false,
  disabled = false,
  multiple = false,
  maxFiles = 5,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const selectedFiles = (multiple ? (files ?? []) : (file ? [file] : [])) as File[];

  const handleAreaClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleAreaClick();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;

    if (multiple) {
      const current = (files ?? []) as File[];
      const next = [...current, ...picked].slice(0, maxFiles);
      onFilesSelect?.(next);
      // allow picking same file again later
      e.target.value = '';
      return;
    }

    if (picked[0]) {
      onFileSelect?.(picked[0]);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <label id={labelId} className="flex items-center text-sm font-semibold text-slate-700 mb-2">
        {label} 
        {required && selectedFiles.length === 0 && <span className="text-red-600 ml-1" aria-label="obrigatório">*</span>}
        {required && selectedFiles.length > 0 && <CheckCircle className="w-4 h-4 text-emerald-600 ml-1.5" aria-label="completo" />}
      </label>
      
      {selectedFiles.length === 0 ? (
        <div 
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={handleAreaClick}
          onKeyDown={handleKeyDown}
          aria-labelledby={labelId}
          aria-disabled={disabled}
          className={`border-2  rounded-lg p-4 flex items-center justify-center transition-all duration-150 bg-white min-h-14 ${
            disabled
              ? 'opacity-50 cursor-not-allowed border-slate-300'
              : 'cursor-pointer border-slate-300 hover:border-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2'
          }`}
        >
          <Upload className={`h-5 w-5 mr-2 ${disabled ? 'text-slate-400' : 'text-slate-500'}`} aria-hidden="true" />
          <span className={`text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-600'}`}>
            Clique para selecionar 
          </span>
          <input 
            type="file" 
            ref={inputRef}
            className="sr-only" 
            onChange={handleChange}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            aria-label={label}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {multiple && (
            <div
              role="button"
              tabIndex={disabled ? -1 : 0}
              onClick={selectedFiles.length >= maxFiles ? undefined : handleAreaClick}
              onKeyDown={handleKeyDown}
              aria-labelledby={labelId}
              aria-disabled={disabled || selectedFiles.length >= maxFiles}
              className={`border-2 rounded-lg p-3 flex items-center justify-center transition-all duration-150 bg-white min-h-12 ${
                disabled || selectedFiles.length >= maxFiles
                  ? 'opacity-50 cursor-not-allowed border-slate-300'
                  : 'cursor-pointer border-slate-300 hover:border-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2'
              }`}
            >
              <Upload className={`h-5 w-5 mr-2 ${disabled ? 'text-slate-400' : 'text-slate-500'}`} aria-hidden="true" />
              <span className={`text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-600'}`}>
                {selectedFiles.length >= maxFiles ? `Limite atingido (máx. ${maxFiles})` : `Adicionar arquivos (${selectedFiles.length}/${maxFiles})`}
              </span>
              <input
                type="file"
                ref={inputRef}
                className="sr-only"
                onChange={handleChange}
                accept={accept}
                multiple
                disabled={disabled || selectedFiles.length >= maxFiles}
                aria-label={label}
              />
            </div>
          )}

          {selectedFiles.map((f, idx) => (
            <div key={`${f.name}-${f.size}-${idx}`} className="relative border border-slate-200 rounded-lg p-3 flex items-center bg-white hover:shadow-sm transition-all min-h-14">
              <div className="bg-slate-100 p-2 rounded-md shrink-0 mr-3">
                <FileText className="h-5 w-5 text-slate-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-sm font-medium text-slate-900 truncate" title={f.name}>{f.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (multiple) onRemoveAt?.(idx);
                  else onRemove?.();
                }}
                disabled={disabled}
                aria-label={`Remover arquivo ${f.name}`}
                className="p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          ))}

          {!multiple && (
            <input
              type="file"
              ref={inputRef}
              className="sr-only"
              onChange={handleChange}
              accept={accept}
              disabled={disabled}
              aria-label={label}
            />
          )}
        </div>
      )}
    </div>
  );
};