'use client'

import { useRouter, useParams } from 'next/navigation'
import { useMemo } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command'
import { useCommandPalette } from './use-command-palette'
import {
  createNavigationActions,
  createEntityActions,
  type CommandAction,
} from './command-actions'

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const router = useRouter()
  const params = useParams()
  const worldId = params?.id as string | undefined

  const navigationActions = useMemo(
    () => (worldId ? createNavigationActions(worldId, router) : []),
    [worldId, router]
  )

  const entityActions = useMemo(
    () => (worldId ? createEntityActions(worldId, router) : []),
    [worldId, router]
  )

  function handleSelect(action: CommandAction) {
    action.onSelect()
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {navigationActions.length > 0 && (
          <CommandGroup heading="Navigation">
            {navigationActions.map((action) => (
              <CommandItem
                key={action.id}
                value={[action.label, ...(action.keywords ?? [])].join(' ')}
                onSelect={() => handleSelect(action)}
              >
                {action.icon && <action.icon className="mr-2 size-4 opacity-70" />}
                {action.label}
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {entityActions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {entityActions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={[action.label, ...(action.keywords ?? [])].join(' ')}
                  onSelect={() => handleSelect(action)}
                >
                  {action.icon && <action.icon className="mr-2 size-4 opacity-70" />}
                  {action.label}
                  {action.shortcut && (
                    <CommandShortcut>{action.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!worldId && (
          <CommandGroup heading="Info">
            <CommandItem disabled>
              Open a story world to see navigation and actions.
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
