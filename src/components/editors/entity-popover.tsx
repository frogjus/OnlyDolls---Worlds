'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import type { WorldEntity } from '@/lib/entity-registry';

interface EntityDetail extends WorldEntity {
  relationships: Array<{ id: string; label: string; targetName: string }>;
  sceneCount: number;
}

interface EntityPopoverProps {
  entityId: string | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onViewFull: (entityId: string) => void;
}

export function EntityPopover({ entityId, anchorRect, onClose, onViewFull }: EntityPopoverProps) {
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entityId) {
      setEntity(null);
      return;
    }
    fetch(`/api/entities/${entityId}`)
      .then(r => r.json())
      .then(setEntity);
  }, [entityId]);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!entityId) return;
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [entityId, handleClickOutside]);

  useEffect(() => {
    if (!entityId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [entityId, onClose]);

  if (!entityId || !anchorRect || !entity) return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      className="z-50 w-80 rounded-lg bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95"
      style={{
        position: 'fixed',
        left: anchorRect.left,
        top: anchorRect.bottom + 4,
      }}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{entity.name}</h4>
          <Badge variant="outline">{entity.type}</Badge>
        </div>

        {entity.description && (
          <p className="text-sm text-muted-foreground">{entity.description}</p>
        )}

        {entity.relationships.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1">Relationships</p>
            <div className="flex flex-wrap gap-1">
              {entity.relationships.slice(0, 5).map(rel => (
                <Badge key={rel.id} variant="secondary" className="text-xs">
                  {rel.label}: {rel.targetName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {entity.sceneCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Appears in {entity.sceneCount} scene{entity.sceneCount !== 1 ? 's' : ''}
          </p>
        )}

        <button
          onClick={() => onViewFull(entity.id)}
          className="text-xs text-primary hover:underline"
        >
          View full profile
        </button>
      </div>
    </div>,
    document.body
  );
}
