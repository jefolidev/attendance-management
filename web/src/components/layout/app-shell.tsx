import { Eye, Menu, X } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/use-auth'
import { Sidebar } from './sidebar'
import { ThemeToggle } from './theme-toggle'

export function AppShell() {
  const { employee, impersonatedUser, clearImpersonatedUser } = useAuth()
  const location = useLocation()
  const isAdminArea = location.pathname.startsWith('/admin')
  const displayUser = impersonatedUser || employee

  return (
    <div className="min-h-svh bg-background">
      <div className="flex min-h-svh">
        <div className="hidden lg:block">
          <Sidebar admin={isAdminArea} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="sr-only">Menu principal</SheetTitle>
                  <Sidebar admin={isAdminArea} />
                </SheetContent>
              </Sheet>
              <span className="text-sm text-muted-foreground">{isAdminArea ? 'Área administrativa' : <>Olá, <span className="font-medium text-foreground">{displayUser?.username}</span></>}</span>
            </div>
            <div className="flex items-center gap-2">
              {isAdminArea && impersonatedUser && (
                <div className="hidden items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200 sm:flex">
                  <Eye className="size-3.5" />
                  <span>Visualizando como <strong>{impersonatedUser.username}</strong></span>
                  <Link to="/admin/select-profile" className="font-medium underline underline-offset-2">Trocar</Link>
                  <button type="button" onClick={clearImpersonatedUser} className="rounded p-0.5 hover:bg-violet-200 dark:hover:bg-violet-900" aria-label="Sair da visualização"><X className="size-3.5" /></button>
                </div>
              )}
              <ThemeToggle />
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{employee?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          {isAdminArea && impersonatedUser && (
            <div className="border-b border-violet-200 bg-violet-50 px-4 py-2 text-center text-xs text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
              Visualizando como <strong>{impersonatedUser.username}</strong>. <Link to="/admin/select-profile" className="underline underline-offset-2">Trocar usuário</Link> · <button type="button" onClick={clearImpersonatedUser} className="underline underline-offset-2">Sair</button>
            </div>
          )}

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
