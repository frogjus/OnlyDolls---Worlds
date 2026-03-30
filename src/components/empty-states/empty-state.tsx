import type { LucideIcon } from 'lucide-react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--od-border-emphasis)] bg-card p-14 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted shadow-[var(--od-glow-teal-sm)]">
        <Icon className="h-10 w-10 text-primary/70" />
      </div>
      <h3 className="mt-6 font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      {comingSoon && (
        <span className="text-caption mt-3 inline-block rounded-full border border-[var(--od-border-emphasis)] bg-muted px-3 py-1 text-[var(--od-text-secondary)]">
          Coming Soon
        </span>
      )}
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--od-text-secondary)]">
        {description}
      </p>
      {primaryAction && (
        <Button className="mt-6 bg-primary text-primary-foreground hover:bg-[var(--od-teal-600)] glow-teal-hover transition-all" onClick={primaryAction.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {primaryAction.label}
        </Button>
      )}
      {secondaryLabel && secondaryHref && (
        <a
          href={secondaryHref}
          className="mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          {secondaryLabel}
        </a>
      )}
    </div>
  )
}
