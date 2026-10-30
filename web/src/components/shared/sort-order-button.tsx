import { ArrowDownUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SortDirection } from '@/lib/sorting'

export function SortOrderButton({ value, onChange }: { value: SortDirection; onChange: (value: SortDirection) => void }) {
  const isNewestFirst = value === 'desc'

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label={`Ordenação: ${isNewestFirst ? 'mais recentes primeiro' : 'mais antigos primeiro'}`}
      onClick={() => onChange(isNewestFirst ? 'asc' : 'desc')}
    >
      <ArrowDownUp className="size-4" />
      {isNewestFirst ? 'Mais recentes' : 'Mais antigos'}
    </Button>
  )
}
