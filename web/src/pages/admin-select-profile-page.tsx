import { useQuery } from '@tanstack/react-query'
import { ArrowRight, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { useAuth } from '@/features/auth/use-auth'
import { getAdminEmployees } from '@/services/admin-service'

export function AdminSelectProfilePage() {
  const navigate = useNavigate()
  const { setImpersonatedUser, impersonatedUser } = useAuth()
  const employeesQuery = useQuery({ queryKey: ['admin-employees', 1, 100, 'desc'], queryFn: () => getAdminEmployees(1, 100, 'desc') })

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="Quem você quer gerenciar?" description="Escolha um perfil para consultar seus registros, saldo e atrasos." />

      {employeesQuery.isLoading && <LoadingState rows={6} />}
      {employeesQuery.isError && <EmptyState title="Não foi possível carregar os perfis" description="Verifique a conexão com a API e tente novamente." action={<Button variant="outline" onClick={() => void employeesQuery.refetch()}>Tentar novamente</Button>} />}
      {employeesQuery.data && employeesQuery.data.employees.length === 0 && <EmptyState title="Nenhum perfil encontrado" description="Cadastre um usuário para começar a gerenciar perfis." />}
      {employeesQuery.data && employeesQuery.data.employees.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {employeesQuery.data.employees.map((employee) => {
            const isSelected = impersonatedUser?.id === employee.id
            return (
              <button
                key={employee.id}
                type="button"
                onClick={() => {
                  setImpersonatedUser(employee)
                  navigate('/admin')
                }}
                className={`group flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition-transform duration-200 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? 'border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30' : 'border-border/70 bg-card hover:border-foreground/20'}`}
              >
                <Avatar size="lg" className="size-16 bg-muted text-xl font-semibold">
                  <AvatarFallback>{employee.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="space-y-1">
                  <span className="block text-sm font-medium">{employee.username}</span>
                  <span className="block text-xs text-muted-foreground">{employee.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">Gerenciar <ArrowRight className="size-3" /></span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex justify-center text-sm text-muted-foreground">
        <UserRound className="mr-2 size-4" /> O token continua sendo o do administrador.
      </div>
    </div>
  )
}
