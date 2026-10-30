import { ArrowLeft, ChartNoAxesColumnIncreasing, ClipboardList, Clock3, History, House, LogOut, Settings, TimerReset, UserRound, Users, WalletCards } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth/use-auth'

const userItems = [
  { to: '/', label: 'Hoje', icon: House },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/banco-de-horas', label: 'Banco de horas', icon: WalletCards },
  { to: '/atrasos', label: 'Atrasos', icon: TimerReset },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

const adminItems = [
  { to: '/admin', label: 'Dashboard', icon: ChartNoAxesColumnIncreasing, end: true },
  { to: '/admin/users', label: 'Usuários', icon: Users },
  { to: '/admin/records', label: 'Registros', icon: ClipboardList },
  { to: '/admin/settings', label: 'Configurações', icon: Settings },
  { to: '/admin/select-profile', label: 'Selecionar perfil', icon: UserRound },
]

export function Sidebar({ onNavigate, admin = false }: { onNavigate?: () => void; admin?: boolean }) {
  const items = admin ? adminItems : userItems
  const { logout } = useAuth()

  return (
    <aside className="flex h-full w-full flex-col bg-zinc-50 px-4 py-5 dark:bg-zinc-950 lg:w-64 lg:border-r lg:px-5">
      <div className="flex items-center justify-between px-2">
        <NavLink to={admin ? '/admin' : '/'} className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
            <Clock3 className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{admin ? 'Ponto digital · Admin' : 'Ponto digital'}</span>
        </NavLink>
      </div>

      <Separator className="my-6" />

      <nav className="space-y-1" aria-label="Navegação principal">
        {items.map((item) => {
          const { to, label, icon: Icon } = item
          return (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              isActive && 'bg-muted font-medium text-foreground',
            )}
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
          )
        })}
      </nav>

      {admin && (
        <NavLink to="/" onClick={onNavigate} className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Visão de usuário
        </NavLink>
      )}

      <div className="mt-auto flex justify-end">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => void logout()} aria-label="Sair" title="Sair">
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  )
}
