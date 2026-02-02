import { ClipboardCheck, Edit3, CheckCircle2, FileDown, ArrowRight, BookOpen } from 'lucide-react'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'

const steps = [
  {
    title: 'Acesse o formulário enviado',
    description:
      'Entre em "Meus formulários", localize o formulário recebido e clique para abrir.',
    icon: <ClipboardCheck size={20} aria-hidden="true" />,
    color: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200',
  },
  {
    title: 'Preencha cada seção',
    description:
      'Responda todas as perguntas com atenção. Você pode avançar entre itens avaliados pelo menu lateral.',
    icon: <Edit3 size={20} aria-hidden="true" />,
    color: 'bg-purple-100 text-purple-600',
    borderColor: 'border-purple-200',
  },
  {
    title: 'Conclua o formulário',
    description:
      'Quando tudo estiver preenchido, finalize o formulário. Certifique-se de revisar suas respostas antes de concluir.',
    icon: <CheckCircle2 size={20} aria-hidden="true" />,
    color: 'bg-amber-100 text-amber-600',
    borderColor: 'border-amber-200',
  },
  {
    title: 'Gere seu relatório',
    description:
      'Após a conclusão, utilize a opção de relatório para baixar o arquivo final.',
    icon: <FileDown size={20} aria-hidden="true" />,
    color: 'bg-emerald-100 text-emerald-600',
    borderColor: 'border-emerald-200',
  },
]

export default function HelpUserPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Central de Ajuda" subtitle="Guia do Usuário" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Hero Section */}
        <section className="bg-slate-900 rounded-2xl shadow-strong p-8 md:p-12 mb-10 text-white relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <BookOpen size={24} className="text-blue-400" />
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">Tutorial</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Passo a Passo do Usuário</h1>
            <p className="text-slate-300 max-w-2xl leading-relaxed text-base">
              Este guia explica como preencher o formulário PLD e gerar o relatório quando ele estiver concluído.
            </p>
          </div>
        </section>

        {/* Fluxo de passos */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-medium">1</span>
            <h2 className="text-xl font-bold text-slate-900">Seu Fluxo de Trabalho</h2>
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
            <h2 className="text-xl font-bold text-slate-900">Dicas Importantes</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl border-2 border-cyan-100 shadow-soft p-6 hover:shadow-medium transition-all duration-300 hover:border-cyan-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Edit3 size={22} className="text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Dicas de preenchimento</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span>Revise cada resposta antes de avançar para a próxima seção.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span>Utilize informações completas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <span>Se necessário, salve e continue mais tarde.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border-2 border-emerald-100 shadow-soft p-6 hover:shadow-medium transition-all duration-300 hover:border-emerald-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <FileDown size={22} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Geração de relatório</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Após concluir, volte para "Meus formulários".</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Clique em "Relatório" para baixar o arquivo.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>Guarde o arquivo para auditorias ou revisões futuras.</span>
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
