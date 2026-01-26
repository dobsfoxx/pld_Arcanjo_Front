import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, User as UserIcon, CreditCard, LogOut, HelpCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/useAuth'

type Props = {
  className?: string
}

export default function UserMenu({ className }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const subscriptionActive = (user?.subscriptionStatus || '').toUpperCase() === 'ACTIVE'
  const showUpgrade = !subscriptionActive && user?.role !== 'ADMIN'
  const showAdminHelp = user?.role === 'ADMIN' || user?.role === 'TRIAL_ADMIN'

  const label = useMemo(() => {
    if (!user) return 'Menu'
    const name = (user.name || '').trim()
    if (name) return name
    return user.email
  }, [user])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div className={className || ''}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <UserIcon size={16} aria-hidden="true" />
          <span className="hidden sm:inline max-w-[220px] truncate">{label}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            onMouseLeave={() => setOpen(false)}
          >
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/profile')
              }}
              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <UserIcon size={16} aria-hidden="true" />
              Perfil
            </button>

            {showUpgrade && (
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/payment')
                }}
                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <CreditCard size={16} aria-hidden="true" />
                Fazer upgrade
              </button>
            )}

            <div className="h-px bg-slate-200" />

            <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Ajuda
            </div>

            {showAdminHelp && (
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/help/admin')
                }}
                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <ShieldCheck size={16} aria-hidden="true" />
                Ajuda do admin
              </button>
            )}

            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/help/user')
              }}
              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <HelpCircle size={16} aria-hidden="true" />
              Ajuda do usuário
            </button>

            <div className="h-px bg-slate-200" />

            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <LogOut size={16} aria-hidden="true" />
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
