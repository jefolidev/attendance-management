import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({ title, description, action, className }: { title: string; description: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-6 text-center', className)}>
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
