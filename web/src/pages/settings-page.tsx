import { useQuery } from '@tanstack/react-query'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/features/auth/use-auth'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/loading-state'
import { getWorkSchedule } from '@/services/work-schedule-service'

export function SettingsPage() {
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const scheduleQuery = useQuery({ queryKey: ['work-schedule'], queryFn: getWorkSchedule })

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Preferências simples para o uso diário do sistema." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 shadow-none">
          <CardHeader><CardTitle className="text-base">Aparência</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Tema da interface</p><p className="text-sm text-muted-foreground">Sua escolha fica salva neste dispositivo.</p></div><div className="flex gap-1 rounded-lg bg-muted p-1"><Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('light')}><Sun className="mr-2 size-4" />Claro</Button><Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('dark')}><Moon className="mr-2 size-4" />Escuro</Button></div></div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader><CardTitle className="text-base">Jornada prevista</CardTitle></CardHeader>
          <CardContent>
            {scheduleQuery.isLoading && <LoadingState rows={1} />}
            {scheduleQuery.isError && <p className="text-sm text-muted-foreground">A jornada não está disponível.</p>}
            {scheduleQuery.data && <div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Horário</span><span className="font-medium">{scheduleQuery.data.startTime} – {scheduleQuery.data.endTime}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Tolerância</span><span className="font-medium">{scheduleQuery.data.lateTolerance} min</span></div><div className="flex justify-between"><span className="text-muted-foreground">Pausas por dia</span><span className="font-medium">{scheduleQuery.data.breaksPerDay}</span></div></div>}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none lg:col-span-2">
          <CardContent className="p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Sessão atual</p><p className="text-sm text-muted-foreground">Encerre o acesso neste dispositivo.</p></div><Button variant="outline" className="gap-2" onClick={logout}><LogOut className="size-4" />Sair</Button></div><Separator className="my-5" /><p className="text-xs text-muted-foreground">O logout remove o token salvo no navegador. A API atual não possui uma rota de logout.</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
