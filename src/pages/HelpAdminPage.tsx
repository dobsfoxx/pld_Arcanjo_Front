import { ClipboardList, Send, CheckCircle2, FileDown } from 'lucide-react'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'

const steps = [
  {
    title: 'Crie o formulário e as perguntas',
    description:
      'No PLD Builder, adicione itens avaliados e suas perguntas. Organize por seções e revise o texto para ficar claro para o usuário final.',
    icon: <ClipboardList size={18} aria-hidden="true" />,
  },
  {
    title: 'Envie o formulário',
    description:
      'Após salvar, envie o formulário para os usuários. Eles receberão o formulário em “Meus formulários” para preenchimento.',
    icon: <Send size={18} aria-hidden="true" />,
  },
  {
    title: 'Acompanhe a conclusão',
    description:
      'Monitore o andamento e acompanhe a conclusão do formulário pelo usuário.',
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
  },
  {
    title: 'Gere o relatório final',
    description:
      'Com o formulário concluído, gere o relatório para auditoria e histórico do processo.',
    icon: <FileDown size={18} aria-hidden="true" />,
  },
]

export default function HelpAdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Ajuda do Admin" subtitle="Fluxo e funcionamento do formulário" />

      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Fluxo rápido</h2>
          <p className="text-slate-600 mt-2">
            Este guia resume as tarefas principais do administrador: criação de perguntas, envio do
            formulário, conclusão e geração de relatórios.
          </p>

          <div className="grid gap-4 mt-6 md:grid-cols-2">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="border border-slate-200 rounded-lg p-4 flex gap-3 bg-slate-50"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {idx + 1}. {step.title}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900">Como criar perguntas</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>Crie itens avaliados no construtor e dê nomes claros às seções.</li>
              <li>Adicione perguntas objetivas, com linguagem simples e direta.</li>
              <li>Revise a ordem das perguntas para facilitar o preenchimento.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900">Envio do formulário</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>Depois de salvar, utilize a ação de envio para disponibilizar ao usuário.</li>
              <li>O formulário enviado aparece na lista “Meus formulários” do usuário.</li>
              <li>Você pode acompanhar o andamento para saber quem já iniciou ou concluiu.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900">Conclusão do formulário</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>Após o usuário finalizar, o formulário fica concluído automaticamente.</li>
              <li>Não há devolução ou aprovação manual neste fluxo.</li>
              <li>Use o relatório final para auditoria e histórico.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900">Geração de relatórios</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>Com o formulário concluído, acesse a opção de gerar relatório.</li>
              <li>O relatório consolida as respostas para auditoria e histórico.</li>
              <li>Baixe e compartilhe o arquivo conforme a necessidade do processo.</li>
            </ul>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
