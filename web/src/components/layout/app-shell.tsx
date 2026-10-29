import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/use-auth'
import { Sidebar } from './sidebar'
import { ThemeToggle } from './theme-toggle'

export function AppShell() {
  const { employee } = useAuth()

  return (
    <div className="min-h-svh bg-background">
      <div className="flex min-h-svh">
        <div className="hidden lg:block">
          <Sidebar />
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
                  <Sidebar />
                </SheetContent>
              </Sheet>
              <span className="text-sm text-muted-foreground">Olá, <span className="font-medium text-foreground">{employee?.username}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{employee?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </header>

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
