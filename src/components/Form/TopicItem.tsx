import React, { useState } from "react";
import { Button } from "../ui/Button";
import { QuestionList } from "./QuestionList";
import { QuestionCreator } from "./QuestionCreator";
import { Edit2, Plus, Save, X, Upload, FileText } from "lucide-react";
import toast from "react-hot-toast";
import type { Topic } from "../../types/pld";

interface TopicItemProps {
  topic: Topic;
  onDataChange: () => void;
}

export const TopicItem: React.FC<TopicItemProps> = ({
  topic,
  onDataChange,
}) => {
  const [showQuestionCreator, setShowQuestionCreator] = useState(false);
  const [isEditingNorm, setIsEditingNorm] = useState(false);
  const [normText, setNormText] = useState(topic.internalNorm || "");
  const [hasInternalNorm, setHasInternalNorm] = useState<"sim" | "não" | "">("");
  const [normFile, setNormFile] = useState<File | null>(null);
  const [hasUploadedNorm, setHasUploadedNorm] = useState(false);

  const handleSaveNorm = async () => {
    try {
      // TODO: Implementar API para salvar norma
      // Marca localmente que existe uma norma associada ao tópico
      if (hasInternalNorm === "sim" && normFile) {
        setHasUploadedNorm(true);
      } else {
        setHasUploadedNorm(false);
      }
      setIsEditingNorm(false);
      onDataChange();
    } catch (error) {
      console.error("Erro ao salvar norma:", error);
    }
  };

  const handleNormFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];
      const maxSize = 10 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        toast.error("Tipo de arquivo não permitido");
        return;
      }

      if (file.size > maxSize) {
        toast.error("Arquivo muito grande");
        return;
      }

      setNormFile(file);
    }
  };

  const removeNormFile = () => {
    setNormFile(null);
  };

  const handleQuestionCreated = () => {
    setShowQuestionCreator(false);
    onDataChange();
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
      {/* Nome e Descrição do Tópico */}
      <div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Norma Interna
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingNorm(!isEditingNorm)}
              className="flex items-center gap-2"
            >
              {isEditingNorm ? (
                <X className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
              {topic.internalNorm ? "Editar" : "Adicionar"}
            </Button>
          </div>

          {isEditingNorm ? (
            <div className="space-y-4">
              {/* Pergunta de Norma Interna (Sim/Não) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Há referência à norma interna para este tópico?
                </label>
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setHasInternalNorm("sim")}
                    className={`flex-1 p-3 border-2 rounded-lg text-center transition-colors ${
                      hasInternalNorm === "sim"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                  >
                    <div className="font-medium">Sim</div>
                    <div className="text-xs mt-1">Há norma interna para o tópico</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setHasInternalNorm("não");
                      setNormFile(null);
                    }}
                    className={`flex-1 p-3 border-2 rounded-lg text-center transition-colors ${
                      hasInternalNorm === "não"
                        ? "border-gray-500 bg-gray-50 text-gray-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="font-medium">Não</div>
                    <div className="text-xs mt-1">Sem norma interna</div>
                  </button>
                </div>
              </div>

              {/* Upload da Norma / Descrição - apenas se Sim */}
              {hasInternalNorm === "sim" && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  {/* Upload de Arquivo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload da Norma (PDF, Word, Imagem)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-10 w-10 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                            <span>Selecione um arquivo</span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={handleNormFileChange}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </label>
                          <p className="pl-1">ou arraste aqui</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, JPG, PNG até 10MB
                        </p>
                      </div>
                    </div>

                    {normFile && (
                      <div className="mt-3 flex items-center justify-between bg-white border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{normFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(normFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeNormFile}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Descrição da Norma */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição / Referência da Norma Interna
                    </label>
                    <textarea
                      value={normText}
                      onChange={(e) => setNormText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={3}
                      placeholder="Descreva brevemente a norma interna que rege este tópico..."
                    />
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingNorm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNorm}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
              {topic.internalNorm ? (
                <p className="text-gray-700">{topic.internalNorm}</p>
              ) : hasUploadedNorm ? (
                <p className="text-gray-700">Norma adicionada</p>
              ) : (
                <p className="text-gray-500 italic">
                  Nenhuma norma adicionada.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cabeçalho das Perguntas */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <h4 className="font-semibold text-gray-900">Perguntas</h4>
          <p className="text-sm text-gray-600">
            {topic.questions.length} perguntas neste tópico
          </p>
        </div>

        <Button
          onClick={() => setShowQuestionCreator(true)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Nova Pergunta
        </Button>
      </div>

      {/* Lista de Perguntas */}
      <QuestionList topic={topic} onDataChange={onDataChange} />

      {/* Modal Criar Pergunta */}
      {showQuestionCreator && (
        <QuestionCreator
          topicId={topic.id}
          topicName={topic.name}
          onClose={() => setShowQuestionCreator(false)}
          onSuccess={handleQuestionCreated}
        />
      )}
    </div>
  );
};
