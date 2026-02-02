import { ClipboardList, Send, CheckCircle2, FileDown, ArrowRight, Lightbulb } from 'lucide-react'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'

const steps = [
  {
    title: 'Crie o formulário e as perguntas',
    description:
      'No PLD Builder, adicione itens avaliados e suas perguntas. Organize por seções e revise o texto para ficar claro para o usuário final.',
    icon: <ClipboardList size={20} aria-hidden="true" />,
    color: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200',
  },
  {
    title: 'Envie o formulário',
    description:
      'Após salvar, envie o formulário para os usuários. Eles receberão o formulário em "Meus formulários" para preenchimento.',
    icon: <Send size={20} aria-hidden="true" />,
    color: 'bg-purple-100 text-purple-600',
    borderColor: 'border-purple-200',
  },
  {
    title: 'Acompanhe a conclusão',
    description:
      'Monitore o andamento e acompanhe a conclusão do formulário pelo usuário.',
    icon: <CheckCircle2 size={20} aria-hidden="true" />,
    color: 'bg-amber-100 text-amber-600',
    borderColor: 'border-amber-200',
  },
  {
    title: 'Gere o relatório final',
    description:
      'Com o formulário concluído, gere o relatório para auditoria e histórico do processo.',
    icon: <FileDown size={20} aria-hidden="true" />,
    color: 'bg-emerald-100 text-emerald-600',
    borderColor: 'border-emerald-200',
  },
]

export default function HelpAdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Central de Ajuda" subtitle="Guia do Administrador" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Hero Section */}
        <section className="bg-slate-900 rounded-2xl shadow-strong p-8 md:p-12 mb-10 text-white relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Lightbulb size={24} className="text-amber-400" />
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">Guia Completo</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Bem-vindo ao Guia do Admin</h1>
            <p className="text-slate-300 max-w-2xl leading-relaxed text-base">
              Este guia resume as tarefas principais do administrador: criação de perguntas, envio do
              formulário, acompanhamento e geração de relatórios.
            </p>
          </div>
        </section>

        {/* Fluxo de passos */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-medium">1</span>
            <h2 className="text-xl font-bold text-slate-900">Fluxo de Trabalho</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className={`relative bg-white border-2 ${step.borderColor} rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 group hover:-translate-y-1`}
              >
                <div className={`w-14 h-14 rounded-xl ${step.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  {step.icon}
                </div>
                <p className="text-base font-bold text-slate-900 mb-2">
                  <span className="text-slate-400 mr-1">{idx + 1}.</span> {step.title}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                
                {idx < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-100 items-center justify-center border-2 border-slate-200">
                    <ArrowRight size={12} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Cards de detalhes */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-medium">2</span>
            <h2 className="text-xl font-bold text-slate-900">Detalhes por Etapa</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-soft p-6 hover:shadow-medium transition-all duration-300 hover:border-blue-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ClipboardList size={22} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Como criar perguntas</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Crie itens avaliados no construtor e dê nomes claros às seções.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Adicione perguntas objetivas, com linguagem simples e direta.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span>Revise a ordem das perguntas para facilitar o preenchimento.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-soft p-6 hover:shadow-medium transition-all duration-300 hover:border-purple-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Send size={22} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Envio do formulário</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Depois de salvar, utilize a ação de envio para disponibilizar ao usuário.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>O formulário enviado aparece na lista "Meus formulários" do usuário.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span>Você pode acompanhar o andamento para saber quem já iniciou ou concluiu.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border-2 border-amber-100 shadow-soft p-6 hover:shadow-medium transition-all duration-300 hover:border-amber-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Conclusão do formulário</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>Após o usuário finalizar, o formulário fica concluído automaticamente.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>Não há devolução ou aprovação manual neste fluxo.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>Use o relatório final para auditoria e histórico.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-soft p-6 hover:shadow-medium transition-all duration-300 hover:border-emerald-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <FileDown size={22} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Geração de relatórios</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Com o formulário concluído, acesse a opção de gerar relatório.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>O relatório consolida as respostas para auditoria e histórico.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Baixe e compartilhe o arquivo conforme a necessidade do processo.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
