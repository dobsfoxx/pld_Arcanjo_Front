import { useEffect, useState } from 'react';
import { Header } from '../components/Layout/Header';
import { TopicList } from '../components/Form/TopicList';
import { ProgressDashboard } from '../components/Progress/ProgressDashBoard';
import { TopicCreator } from '../components/Form/TopicCreator';
import { Button } from '../components/ui/Button';
import { Plus, RefreshCw, Download } from 'lucide-react';
import { pldApi } from '../lib/api';
import type { Topic, FormProgress } from '../types/pld';
import toast from 'react-hot-toast';

export default function FormPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<FormProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopicCreator, setShowTopicCreator] = useState(false);

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const [topicsRes, progressRes] = await Promise.all([
        pldApi.getTopics(),
        pldApi.getProgress(),
      ]);
      setTopics(topicsRes.data.topics);
      setProgress(progressRes.data.progress);
    } catch (error) {
      toast.error('Erro ao carregar dados do formulário');
      console.error('Erro:', error);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleTopicCreated = () => {
    setShowTopicCreator(false);
    void loadData(false);
    toast.success('Tópico criado com sucesso!');
  };

  const handleExport = () => {
    toast.success('Exportação iniciada!');
    // TODO: Implementar exportação
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard de Progresso */}
        <div className="mb-8">
          <ProgressDashboard progress={progress} />
        </div>

        {/* Cabeçalho dos Tópicos */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tópicos do PLD</h1>
            <p className="text-gray-600 mt-1">
              Preencha cada tópico conforme as normas de compliance
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => { void loadData(); }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            
            <Button
              onClick={handleExport}
              className="flex items-center gap-2"
              variant='outline'
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            
            <Button
              onClick={() => setShowTopicCreator(true)}
              className="flex items-center gap-2"
              variant='outline'
            >
              <Plus className="w-4 h-4" />
              Novo Tópico
            </Button>
          </div>
        </div>

        {/* Lista de Tópicos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <TopicList 
            topics={topics} 
            onDataChange={() => { void loadData(false); }}
          />
        </div>
      </main>

      {/* Modal Criar Tópico */}
      {showTopicCreator && (
        <TopicCreator
          onClose={() => setShowTopicCreator(false)}
          onSuccess={handleTopicCreated}
        />
      )}
    </div>
  );
}