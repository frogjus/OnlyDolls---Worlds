'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  getShortcutsByCategory,
  formatKey,
  type ShortcutCategory,
} from '@/lib/keyboard-shortcuts'

interface ShortcutHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutHelpDialog({ open, onOpenChange }: ShortcutHelpDialogProps) {
  const grouped = getShortcutsByCategory()
  const categories = (
    Object.entries(grouped) as [ShortcutCategory, (typeof grouped)[ShortcutCategory]][]
  ).filter(([, items]) => items.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick reference for available keyboard shortcuts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          {categories.map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <div className="grid gap-1.5">
                {items.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                  >
                    <span>{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.chord ? (
                        <>
                          <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs">
                            {formatKey(shortcut.keys[0])}
                          </kbd>
                          <span className="text-xs text-muted-foreground">then</span>
                          <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs">
                            {formatKey(shortcut.keys[1])}
                          </kbd>
                        </>
                      ) : (
                        shortcut.keys.map((key, i) => (
                          <kbd
                            key={i}
                            className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs"
                          >
                            {formatKey(key)}
                          </kbd>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
