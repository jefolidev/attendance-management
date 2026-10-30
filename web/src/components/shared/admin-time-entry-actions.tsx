import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogIn, LogOut, MoreHorizontal } from 'lucide-react'
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
import { updateAdminEmployeeTimeEntry } from '@/services/admin-service'
import type { DayEntry } from '@/services/timeclock-service'
import { toast } from 'sonner'

type EditableTime = 'clockIn' | 'clockOut'

export function AdminTimeEntryActions({ employeeId, entry }: { employeeId: string; entry: DayEntry }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<EditableTime | null>(null)
  const [time, setTime] = useState('')
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
    </>
  )
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
