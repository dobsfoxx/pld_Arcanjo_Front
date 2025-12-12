import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, FileText, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Topic } from '../../types/pld';
import { TopicItem } from './TopicItem';
import { pldApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface TopicListProps {
  topics: Topic[];
  onDataChange: () => void;
}

export const TopicList: React.FC<TopicListProps> = ({ topics, onDataChange }) => {
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [topicOrder, setTopicOrder] = useState<string[] | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const calculateTopicProgress = (topic: Topic) => {
    const applicableQuestions = topic.questions.filter(q => q.isApplicable);
    const answeredQuestions = applicableQuestions.filter(q => q.answer);
    if (applicableQuestions.length === 0) return 0;
    return Math.round((answeredQuestions.length / applicableQuestions.length) * 100);
  };

  const topicItems: Topic[] = React.useMemo(() => {
    if (!topicOrder) return topics;

    const byId = new Map(topics.map(t => [t.id, t] as const));
    const ordered: Topic[] = [];

    topicOrder.forEach(id => {
      const t = byId.get(id);
      if (t) {
        ordered.push(t);
        byId.delete(id);
      }
    });

    byId.forEach(t => ordered.push(t));
    return ordered;
  }, [topics, topicOrder]);

  const moveTopic = async (index: number, direction: 'up' | 'down') => {
    const current = topicItems;

    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === current.length - 1)
    ) {
      return;
    }

    const previousOrder = topicOrder ?? topics.map(t => t.id);

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newTopics = [...current];
    const [movedTopic] = newTopics.splice(index, 1);
    newTopics.splice(newIndex, 0, movedTopic);

    const newOrder = newTopics.map(t => t.id);
    setTopicOrder(newOrder);

    try {
      await pldApi.reorderTopics(newOrder);
      toast.success('Ordem dos tópicos atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar ordem dos tópicos:', error);
      toast.error('Erro ao atualizar ordem dos tópicos');
      setTopicOrder(previousOrder);
    }
  };

  const deleteTopic = async (topicId: string) => {
    if (!confirm('Tem certeza que deseja excluir este tópico?')) {
      return;
    }

    try {
      await pldApi.deleteTopic(topicId);
      toast.success('Tópico excluído com sucesso!');
      setTopicOrder(prev => (prev ? prev.filter(id => id !== topicId) : prev));
      onDataChange();
    } catch (error) {
      console.error('Erro ao excluir tópico:', error);
      toast.error('Erro ao excluir tópico');
    }
  };

  if (topicItems.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum tópico encontrado</h3>
        <p className="text-gray-600 mb-6">Comece criando seu primeiro tópico do PLD</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">
          Tópicos ({topicItems.length})
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsReordering(!isReordering)}
          className="flex items-center gap-2"
        >
          <GripVertical className="h-4 w-4" />
          {isReordering ? 'Finalizar ordenação' : 'Reordenar tópicos'}
        </Button>
      </div>

      {topicItems.map((topic, index) => {
        const progress = calculateTopicProgress(topic);
        const isExpanded = expandedTopics.includes(topic.id);

        return (
          <div
            key={topic.id}
            className="border border-gray-200 rounded-xl bg-white overflow-hidden"
          >
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {isReordering ? (
                      <div className="flex flex-col gap-1 pt-1">
                        
                        <button
                          onClick={() => moveTopic(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => moveTopic(index, 'down')}
                          disabled={index === topicItems.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold">
                          {index + 1}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                    {topic.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progresso do tópico */}
                  <div className="hidden md:block w-32">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{progress}%</span>
                      <span>
                        {topic.questions.filter(q => q.answer).length}/
                        {topic.questions.filter(q => q.isApplicable).length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Ações do tópico */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTopic(topic.id)}
                      className="p-2"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTopic(topic.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo expandido */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                <TopicItem 
                  topic={topic}
                  onDataChange={onDataChange}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};