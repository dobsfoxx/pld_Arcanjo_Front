import { ClipboardCheck, Edit3, CheckCircle2, FileDown } from 'lucide-react'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'

const steps = [
  {
    title: 'Acesse o formulário enviado',
    description:
      'Entre em “Meus formulários”, localize o formulário recebido e clique para abrir.',
    icon: <ClipboardCheck size={18} aria-hidden="true" />,
  },
  {
    title: 'Preencha cada seção',
    description:
      'Responda todas as perguntas com atenção. Você pode avançar entre itens avaliados pelo menu lateral.',
    icon: <Edit3 size={18} aria-hidden="true" />,
  },
  {
    title: 'Conclua o formulário',
    description:
      'Quando tudo estiver preenchido, finalize o formulário. Certifique-se de revisar suas respostas antes de concluir.',
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
  },
  {
    title: 'Gere seu relatório',
    description:
      'Após a conclusão, utilize a opção de relatório para baixar o arquivo final.',
    icon: <FileDown size={18} aria-hidden="true" />,
  },
]

export default function HelpUserPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Ajuda do Usuário" subtitle="Como preencher e gerar relatórios" />

      <main className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Passo a passo</h2>
          <p className="text-slate-600 mt-2">
            Este guia explica como preencher o formulário PLD e gerar o relatório quando ele estiver
            concluído.
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
            <h3 className="text-lg font-semibold text-slate-900">Dicas de preenchimento</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>Revise cada resposta antes de avançar para a próxima seção.</li>
              <li>Utilize informações completas para evitar devoluções para correção.</li>
              <li>Se necessário, salve e continue mais tarde.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900">Geração de relatório</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>Após concluir, volte para “Meus formulários”.</li>
              <li>Clique em “Relatório” para baixar o arquivo em PDF.</li>
              <li>Guarde o arquivo para auditorias ou revisões futuras.</li>
            </ul>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  )
}
