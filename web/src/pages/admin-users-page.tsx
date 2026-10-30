import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SortOrderButton } from '@/components/shared/sort-order-button'
import { getErrorMessage } from '@/lib/formatters'
import type { SortDirection } from '@/lib/sorting'
import { createAdminEmployee, getAdminEmployees } from '@/services/admin-service'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const createUserSchema = z.object({
  username: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
})

type CreateUserForm = z.infer<typeof createUserSchema>

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortDirection>('desc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const employeesQuery = useQuery({ queryKey: ['admin-employees', page, 20, sort], queryFn: () => getAdminEmployees(page, 20, sort) })
  const createMutation = useMutation({
    mutationFn: createAdminEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-employees'] })
      setDialogOpen(false)
      reset()
      toast.success('Usuário criado.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'EMPLOYEE' },
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Usuários"
        description="Consulte os perfis e abra a visão individual de cada colaborador."
        action={<Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="size-4" /> Novo usuário</Button>}
      />

      <div className="flex justify-end"><SortOrderButton value={sort} onChange={(value) => { setSort(value); setPage(1) }} /></div>

      {employeesQuery.isLoading && <LoadingState rows={5} />}
      {employeesQuery.isError && <EmptyState title="Usuários indisponíveis" description="Não foi possível carregar a lista de usuários." action={<Button variant="outline" onClick={() => void employeesQuery.refetch()}>Tentar novamente</Button>} />}
      {employeesQuery.data && employeesQuery.data.employees.length === 0 && <EmptyState title="Nenhum usuário encontrado" description="Crie o primeiro perfil para começar." />}
      {employeesQuery.data && employeesQuery.data.employees.length > 0 && (
        <Card className="border-border/70 shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Perfil</TableHead><TableHead>Função</TableHead><TableHead>Atualização</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
              <TableBody>
                {employeesQuery.data.employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell><div className="flex items-center gap-3"><Avatar size="sm"><AvatarFallback>{employee.username.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-medium">{employee.username}</p><p className="text-xs text-muted-foreground">{employee.id}</p></div></div></TableCell>
                    <TableCell><Badge variant="outline">{employee.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{employee.updatedAt ? new Date(employee.updatedAt).toLocaleDateString('pt-BR') : 'Sem atualização'}</TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" asChild><Link to={`/admin/users/${employee.id}`}><UserRound className="size-4" /> Editar</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {employeesQuery.data && (
        <div className="flex items-center justify-between border-t pt-5"><p className="text-sm text-muted-foreground">Página {employeesQuery.data.pagination.page} de {employeesQuery.data.pagination.totalPages}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="size-4" /> Anterior</Button><Button variant="outline" size="sm" disabled={!employeesQuery.data.pagination.hasNextPage} onClick={() => setPage((current) => current + 1)}>Próxima <ChevronRight className="size-4" /></Button></div></div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo usuário</DialogTitle><DialogDescription>Crie um acesso interno para a equipe.</DialogDescription></DialogHeader>
          <form id="create-user-form" className="space-y-4" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
            <div className="space-y-2"><Label htmlFor="admin-username">Usuário</Label><Input id="admin-username" {...register('username')} aria-invalid={Boolean(errors.username)} />{errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="admin-password">Senha inicial</Label><Input id="admin-password" type="password" {...register('password')} aria-invalid={Boolean(errors.password)} />{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div>
            <div className="space-y-2"><Label htmlFor="admin-role">Perfil</Label><select id="admin-role" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register('role')}><option value="EMPLOYEE">Colaborador</option><option value="ADMIN">Administrador</option></select></div>
          </form>
          <DialogFooter><Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" form="create-user-form" disabled={createMutation.isPending}>{createMutation.isPending ? 'Criando…' : 'Criar usuário'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
