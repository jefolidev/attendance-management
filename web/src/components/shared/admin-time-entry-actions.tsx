import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, LogIn, LogOut, MoreHorizontal, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatTime, getErrorMessage } from '@/lib/formatters'
import {
  createAdminTimeEntryJustification,
  removeAdminTimeEntryJustification,
  type TimeEntryJustificationType,
  updateAdminEmployeeTimeEntry,
} from '@/services/admin-service'
import type { DayEntry } from '@/services/timeclock-service'
import { toast } from 'sonner'

type EditableTime = 'clockIn' | 'clockOut'

export function AdminTimeEntryActions({ employeeId, entry }: { employeeId: string; entry: DayEntry }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<EditableTime | null>(null)
  const [time, setTime] = useState('')
  const [justifying, setJustifying] = useState<TimeEntryJustificationType | null>(null)
  const [description, setDescription] = useState('')
  const justifications = entry.justifications ?? []
  const updateMutation = useMutation({
    mutationFn: () => updateAdminEmployeeTimeEntry(employeeId, entry.timeEntryId, {
      [editing ?? 'clockIn']: toServerTimestamp(entry.occurredAt, time),
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard-entries', employeeId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard-delays', employeeId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-records', employeeId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-user-entries', employeeId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-user-delays', employeeId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-user-balance', employeeId] }),
        queryClient.invalidateQueries({ queryKey: ['time-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['balance-events'] }),
      ])
      setEditing(null)
      toast.success('Horário da batida atualizado.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const justificationMutation = useMutation({
    mutationFn: () => createAdminTimeEntryJustification(employeeId, entry.timeEntryId, {
      type: justifying!,
      category: 'MEDICAL_EMERGENCY',
      description: description.trim() || undefined,
    }),
    onSuccess: async () => {
      await invalidateEntryQueries(queryClient, employeeId)
      setJustifying(null)
      setDescription('')
      toast.success('Justificativa registrada e saldo recalculado.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const removeJustificationMutation = useMutation({
    mutationFn: (type: TimeEntryJustificationType) => removeAdminTimeEntryJustification(employeeId, entry.timeEntryId, type),
    onSuccess: async () => {
      await invalidateEntryQueries(queryClient, employeeId)
      toast.success('Justificativa removida e saldo recalculado.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openEditor = (field: EditableTime) => {
    const currentValue = field === 'clockIn' ? entry.occurredAt : entry.clockOut
    setTime(currentValue ? formatTimeInput(currentValue) : '')
    setEditing(field)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ações da batida">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => openEditor('clockIn')}>
            <LogIn className="size-4" />
            Editar horário de início
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openEditor('clockOut')}>
            <LogOut className="size-4" />
            {entry.clockOut ? 'Editar horário de final' : 'Definir horário de saída'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setJustifying('LATE_ARRIVAL')}>
            <ShieldCheck className="size-4" />
            {hasJustification(justifications, 'LATE_ARRIVAL') ? 'Remover justificativa do atraso' : 'Justificar atraso de entrada'}
          </DropdownMenuItem>
          {entry.clockOut && (
            <DropdownMenuItem onSelect={() => setJustifying('EARLY_DEPARTURE')}>
              <AlertCircle className="size-4" />
              {hasJustification(justifications, 'EARLY_DEPARTURE') ? 'Remover justificativa da saída' : 'Justificar saída antecipada'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === 'clockIn' ? 'Editar horário de início' : entry.clockOut ? 'Editar horário de final' : 'Definir horário de saída'}</DialogTitle>
            <DialogDescription>Informe o horário da batida. A data do registro será preservada e os cálculos serão atualizados.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault()
            if (!isValidTime(time)) {
              toast.error('Informe um horário válido no formato 24 horas, como 08:30.')
              return
            }
            updateMutation.mutate()
          }}>
            <div className="space-y-2">
              <Label htmlFor="admin-entry-time">Horário</Label>
              <Input id="admin-entry-time" type="text" inputMode="numeric" placeholder="HH:mm" maxLength={5} pattern="[0-9]{2}:[0-9]{2}" required value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Salvando…' : 'Salvar horário'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(justifying)} onOpenChange={(open) => !open && setJustifying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{justifying === 'LATE_ARRIVAL' ? 'Justificar atraso de entrada' : 'Justificar saída antecipada'}</DialogTitle>
            <DialogDescription>Use esta opção somente para registrar uma emergência médica. O horário real será preservado e apenas o débito automático correspondente será desconsiderado.</DialogDescription>
          </DialogHeader>
          {justifying && hasJustification(justifications, justifying) ? (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setJustifying(null)}>Cancelar</Button>
              <Button type="button" variant="destructive" disabled={removeJustificationMutation.isPending} onClick={() => {
                if (window.confirm('Remover esta justificativa e recalcular o saldo?')) {
                  removeJustificationMutation.mutate(justifying)
                  setJustifying(null)
                }
              }}>{removeJustificationMutation.isPending ? 'Removendo…' : 'Remover justificativa'}</Button>
            </DialogFooter>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); justificationMutation.mutate() }}>
              <div className="space-y-2">
                <Label htmlFor="justification-description">Observação (opcional)</Label>
                <Input id="justification-description" placeholder="Ex.: atendimento médico" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setJustifying(null)}>Cancelar</Button>
                <Button type="submit" disabled={justificationMutation.isPending}>{justificationMutation.isPending ? 'Salvando…' : 'Confirmar justificativa'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function hasJustification(
  justifications: DayEntry['justifications'],
  type: TimeEntryJustificationType,
) {
  return justifications.some((justification) => justification.type === type)
}

async function invalidateEntryQueries(queryClient: ReturnType<typeof useQueryClient>, employeeId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-entries', employeeId] }),
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-delays', employeeId] }),
    queryClient.invalidateQueries({ queryKey: ['admin-records', employeeId] }),
    queryClient.invalidateQueries({ queryKey: ['admin-user-entries', employeeId] }),
    queryClient.invalidateQueries({ queryKey: ['admin-user-delays', employeeId] }),
    queryClient.invalidateQueries({ queryKey: ['admin-user-balance', employeeId] }),
    queryClient.invalidateQueries({ queryKey: ['time-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['balance-events'] }),
  ])
}

function formatTimeInput(value: string) {
  return formatTime(value)
}

function toServerTimestamp(dateTime: string, time: string) {
  const date = dateTime.slice(0, 10)
  return new Date(`${date}T${time}:00-03:00`).toISOString()
}

function isValidTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return false

  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}
