import { zodResolver } from '@hookform/resolvers/zod'
import { Clock3, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage } from '@/lib/formatters'

const loginSchema = z.object({
  username: z.string().min(2, 'Informe seu usuário.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [requestError, setRequestError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const onSubmit = async ({ username, password }: LoginForm) => {
    setRequestError(null)

    try {
      await login(username, password)
      const destination = (location.state as { from?: string } | null)?.from || '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setRequestError(getErrorMessage(error))
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Clock3 className="size-5" /></span>
          <div>
            <p className="font-semibold tracking-tight">Ponto digital</p>
            <p className="text-sm text-muted-foreground">Registro interno de jornada</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-7 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
            <p className="text-sm text-muted-foreground">Acesse seus registros e bata o ponto.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" autoComplete="username" placeholder="seu usuário" aria-invalid={Boolean(errors.username)} {...register('username')} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" placeholder="Sua senha" aria-invalid={Boolean(errors.password)} {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {requestError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{requestError}</p>}
            <Button type="submit" className="h-11 w-full gap-2" disabled={isSubmitting}>
              <LogIn className="size-4" />
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
