import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return <main className="grid min-h-svh place-items-center bg-background px-6 text-center"><div><p className="text-sm font-medium text-muted-foreground">Erro 404</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Página não encontrada</h1><p className="mt-2 text-muted-foreground">O endereço acessado não existe neste sistema.</p><Button asChild className="mt-6"><Link to="/">Voltar para hoje</Link></Button></div></main>
}
