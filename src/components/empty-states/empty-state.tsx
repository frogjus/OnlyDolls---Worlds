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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {comingSoon && (
        <Badge variant="secondary" className="mt-2">
          Coming Soon
        </Badge>
      )}
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {primaryAction && (
        <Button className="mt-4" onClick={primaryAction.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {primaryAction.label}
        </Button>
      )}
      {secondaryLabel && secondaryHref && (
        <a
          href={secondaryHref}
          className="mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {secondaryLabel}
        </a>
      )}
    </div>
  )
}
