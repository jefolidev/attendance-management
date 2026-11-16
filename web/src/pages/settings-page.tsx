import { BellRing, LogOut } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { WorkScheduleForm } from '@/components/shared/work-schedule-form'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage } from '@/lib/formatters'
import type { WorkScheduleFormValues } from '@/lib/work-schedule-schema'
import { createWorkSchedule, getWorkSchedule, updateWorkSchedule } from '@/services/work-schedule-service'
import { deletePushSubscription, getPushConfig, savePushSubscription } from '@/services/push-notifications-service'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { toast } from 'sonner'

export function SettingsPage() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const scheduleQuery = useQuery({ queryKey: ['work-schedule'], queryFn: getWorkSchedule })
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  )
  const [isPushSubscribed, setIsPushSubscribed] = useState(false)
  const [isPushLoading, setIsPushLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !window.isSecureContext || !('serviceWorker' in navigator)) {
      setNotificationPermission('unsupported')
      return
    }
    setNotificationPermission(Notification.permission)
    void navigator.serviceWorker.getRegistration('/').then(async (registration) => {
      const subscription = await registration?.pushManager.getSubscription()
      if (!subscription) return false

      try {
        await saveBrowserPushSubscription(subscription)
        return true
      } catch {
        return false
      }
    }).then(setIsPushSubscribed)
  }, [])

  const enableNotifications = async () => {
    if (!('Notification' in window) || !window.isSecureContext || !('serviceWorker' in navigator)) {
      setNotificationPermission('unsupported')
      return
    }
    setIsPushLoading(true)
    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission !== 'granted') return

      const { publicKey } = await getPushConfig()
      const registration = await navigator.serviceWorker.register('/service-worker.js')
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(publicKey),
        })
      }

      await saveBrowserPushSubscription(subscription, true)
      setIsPushSubscribed(true)
      toast.success('Alertas ativados neste navegador.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsPushLoading(false)
    }
  }

  const disableNotifications = async () => {
    setIsPushLoading(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await deletePushSubscription(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setIsPushSubscribed(false)
      toast.success('Alertas desativados neste navegador.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsPushLoading(false)
    }
  }

  const onSubmit = async (values: WorkScheduleFormValues) => {
    try {
      if (scheduleQuery.data) {
        await updateWorkSchedule(values)
      } else {
        await createWorkSchedule(values)
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['work-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
        queryClient.invalidateQueries({ queryKey: ['accumulated-delay'] }),
      ])
      toast.success(scheduleQuery.data ? 'Horário de trabalho atualizado.' : 'Horário de trabalho configurado.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Ajuste sua jornada e preferências de acesso." />

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Horário de trabalho</CardTitle>
          {!scheduleQuery.data && !scheduleQuery.isLoading && !scheduleQuery.isError && <p className="text-sm text-muted-foreground">Configure sua jornada para liberar o registro de ponto.</p>}
        </CardHeader>
        <CardContent>
          {scheduleQuery.isLoading && <LoadingState rows={2} />}
          {scheduleQuery.isError && <EmptyState title="Horário indisponível" description="Não foi possível carregar o horário de trabalho." action={<Button variant="outline" onClick={() => void scheduleQuery.refetch()}>Tentar novamente</Button>} />}
          {!scheduleQuery.isLoading && !scheduleQuery.isError && (
            <WorkScheduleForm schedule={scheduleQuery.data} onSubmit={onSubmit} idPrefix="user-work-schedule" submitLabel={scheduleQuery.data ? 'Salvar alterações' : 'Configurar horário'} />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader><CardTitle className="text-lg font-medium">Preferências</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-medium">Tema da interface</p><p className="text-sm text-muted-foreground">A escolha fica salva neste dispositivo.</p></div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg font-medium"><BellRing className="size-5 text-muted-foreground" /> Alertas de ponto</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Notificações neste navegador</p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">O Windows exibirá avisos 10 minutos antes da entrada e da saída, se o ponto ainda não tiver sido registrado, e após o horário quando faltar uma batida. Com o Web Push, os avisos podem chegar mesmo com a página fechada.</p>
            {notificationPermission === 'denied' && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">As notificações estão bloqueadas. Libere-as nas permissões do site nas configurações do navegador.</p>}
            {notificationPermission === 'unsupported' && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">Este navegador ou endereço não permite notificações. Use um navegador compatível em uma conexão segura (HTTPS).</p>}
            {isPushSubscribed && <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">Alertas ativos neste navegador. Os horários seguem os dias e ajustes da sua jornada.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isPushSubscribed && <Button onClick={() => void enableNotifications()} disabled={isPushLoading || notificationPermission === 'unsupported'}>{isPushLoading ? 'Ativando…' : 'Ativar alertas'}</Button>}
            {isPushSubscribed && <>
              <Button variant="ghost" onClick={() => void disableNotifications()} disabled={isPushLoading}>Desativar</Button>
            </>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader><CardTitle className="text-lg font-medium">Conta</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Encerre a sessão neste dispositivo.</p>
          <Button variant="outline" className="gap-2" onClick={logout}><LogOut className="size-4" />Sair</Button>
        </CardContent>
      </Card>
    </div>
  )
}

async function saveBrowserPushSubscription(subscription: PushSubscription, replaceExisting = false) {
  const serialized = subscription.toJSON()
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
    throw new Error('O navegador não retornou os dados de inscrição para notificações.')
  }
  await savePushSubscription({
    endpoint: serialized.endpoint,
    keys: { p256dh: serialized.keys.p256dh, auth: serialized.keys.auth },
  }, replaceExisting)
}

function decodeVapidKey(value: string): ArrayBuffer {
  const padded = value.padEnd(value.length + ((4 - value.length % 4) % 4), '=')
  const binary = window.atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return buffer
}

