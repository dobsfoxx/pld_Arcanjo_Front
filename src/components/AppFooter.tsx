export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-300">Arcanjo PLD</p>
          <p className="text-xs text-slate-400">© {year} • Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  )
}
