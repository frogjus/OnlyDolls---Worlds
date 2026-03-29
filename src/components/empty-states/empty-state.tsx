import type { LucideIcon } from 'lucide-react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  primaryAction?: { label: string; onClick: () => void }
  secondaryLabel?: string
  secondaryHref?: string
  comingSoon?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryLabel,
  secondaryHref,
  comingSoon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60 p-14 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/80 shadow-[0_0_25px_rgba(20,184,166,0.08)]">
        <Icon className="h-10 w-10 text-teal-400/70" />
      </div>
      <h3 className="mt-6 text-lg font-bold text-slate-100">{title}</h3>
      {comingSoon && (
        <Badge variant="secondary" className="mt-2 border-slate-600 bg-slate-800 text-slate-300">
          Coming Soon
        </Badge>
      )}
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        {description}
      </p>
      {primaryAction && (
        <Button className="mt-6 bg-teal-600 text-white hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(20,184,166,0.25)] transition-all" onClick={primaryAction.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {primaryAction.label}
        </Button>
      )}
      {secondaryLabel && secondaryHref && (
        <a
          href={secondaryHref}
          className="mt-3 text-sm text-slate-500 underline underline-offset-4 hover:text-teal-400 transition-colors"
        >
          {secondaryLabel}
        </a>
      )}
    </div>
  )
}
