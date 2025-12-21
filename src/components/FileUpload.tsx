import React, { useRef } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  file: File | null | undefined;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  accept?: string;
  required?: boolean;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  file,
  onFileSelect,
  onRemove,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.png',
  required = false,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAreaClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full group">
      <label className="flex items-center text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
        {label} 
        {required && !file && <span className="text-red-500 ml-1 text-xs">*</span>}
        {required && file && <CheckCircle className="w-3 h-3 text-emerald-500 ml-1.5" />}
      </label>
      
      {!file ? (
        <div 
          onClick={handleAreaClick}
          className={`border-1 border-slate-300 rounded-xl p-3 flex items-center justify-center transition-all duration-200 bg-white h-[52px] ${
            disabled
              ? 'opacity-60 cursor-not-allowed'
              : 'cursor-pointer hover:border-blue-400 hover:gap-2 hover:bg-blue-50/30'
          }`}
        >
          <Upload className="h-4 w-4-8 group-hover:text-blue-500 mr-2 transition-colors" />
          <span className="text-xs font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
            Selecionar arquivo
          </span>
          <input 
            type="file" 
            ref={inputRef}
            className="hidden" 
            onChange={handleChange}
            accept={accept}
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="relative border border-slate-200 rounded-xl p-2 pl-3 flex items-center bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all h-[52px]">
          <div className="bg-blue-100 p-1.5 rounded-lg shrink-0 mr-3">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0 mr-2">
            <p className="text-xs font-semibold text-slate-700 truncate" title={file.name}>{file.name}</p>
            <p className="text-[10px]-8 font-medium">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={disabled}
            className="p-1.5 rounded-lg-8 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};