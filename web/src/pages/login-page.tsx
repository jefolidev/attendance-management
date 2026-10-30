import { zodResolver } from '@hookform/resolvers/zod'
import { Clock3, Eye, EyeOff, LogIn, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage } from '@/lib/formatters'
import { ThemeToggle } from '@/components/layout/theme-toggle'

const loginSchema = z.object({
  username: z.string().min(2, 'Informe seu usuário.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { isAuthenticated, isAdmin, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [requestError, setRequestError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  }

  const onSubmit = async ({ username, password }: LoginForm) => {
    setRequestError(null)

    try {
      const loggedUser = await login(username, password)
      const destination = (location.state as { from?: string } | null)?.from || (loggedUser.role === 'ADMIN' ? '/admin' : '/')
      navigate(destination, { replace: true })
    } catch (error) {
      setRequestError(getErrorMessage(error))
    }
  }

  return (
    <main className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden bg-neutral-50 px-5 py-10 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="pointer-events-none absolute -right-52 top-1/2 z-0 size-[min(800px,125vw)] -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-200 via-fuchsia-100 to-indigo-200 blur-3xl opacity-40 dark:from-purple-600 dark:via-fuchsia-500 dark:to-indigo-900 dark:opacity-60" />
      <div className="pointer-events-none absolute -left-10 -top-10 z-0 size-32 rounded-full bg-fuchsia-200 blur-xl opacity-30 dark:bg-purple-500" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.025] [background-image:linear-gradient(rgba(0,0,0,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.3)_1px,transparent_1px)] [background-size:32px_32px] dark:[background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)]" />

      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-black/5 bg-white/70 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/40 sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"><Clock3 className="size-5" /></span>
            <div>
              <p className="font-semibold tracking-tight">Ponto digital</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Registro interno de jornada</p>
            </div>
          </div>

          <div className="mb-7 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Acesse sua conta para continuar.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" autoComplete="username" placeholder="seu usuário" className="border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" aria-invalid={Boolean(errors.username)} {...register('username')} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" className="border-black/10 bg-black/5 pr-11 dark:border-white/10 dark:bg-white/5" aria-invalid={Boolean(errors.password)} {...register('password')} />
                <button type="button" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-neutral-500 hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {requestError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{requestError}</p>}
            <Button type="submit" size="lg" className="h-11 w-full gap-2 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-purple-600 dark:hover:bg-purple-500" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
