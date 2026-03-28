'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Editor } from '@tiptap/core';

interface BeatAnchorInfo {
  beatId: string;
  beatTitle: string;
  beatColor: string;
  top: number;
}

interface BeatGutterProps {
  editor: Editor | null;
  onBeatClick?: (beatId: string) => void;
}

export function BeatGutter({ editor, onBeatClick }: BeatGutterProps) {
  const [anchors, setAnchors] = useState<BeatAnchorInfo[]>([]);

  const updateAnchors = useCallback(() => {
    if (!editor) {
      setAnchors([]);
      return;
    }

    const found: BeatAnchorInfo[] = [];

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'beatAnchor') {
        const dom = editor.view.nodeDOM(pos);
        if (dom instanceof HTMLElement) {
          const rect = dom.getBoundingClientRect();
          const editorRect = editor.view.dom.getBoundingClientRect();
          found.push({
            beatId: node.attrs.beatId,
            beatTitle: node.attrs.beatTitle,
            beatColor: node.attrs.beatColor,
            top: rect.top - editorRect.top,
          });
        }
      }
    });

    setAnchors(found);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    updateAnchors();

    editor.on('update', updateAnchors);
    editor.on('selectionUpdate', updateAnchors);

    return () => {
      editor.off('update', updateAnchors);
      editor.off('selectionUpdate', updateAnchors);
    };
  }, [editor, updateAnchors]);

  if (!editor || anchors.length === 0) return null;

  return (
    <div
      className="beat-gutter-overlay"
      style={{ position: 'absolute', left: 0, top: 0, width: '2rem', pointerEvents: 'none' }}
    >
      {anchors.map((anchor) => (
        <div
          key={anchor.beatId}
          className="beat-gutter-dot"
          role="button"
          tabIndex={0}
          title={anchor.beatTitle}
          onClick={() => onBeatClick?.(anchor.beatId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onBeatClick?.(anchor.beatId);
            }
          }}
          style={{
            position: 'absolute',
            top: anchor.top,
            left: '0.25rem',
            width: '0.75rem',
            height: '0.75rem',
            borderRadius: '50%',
            backgroundColor: anchor.beatColor,
            cursor: 'pointer',
            pointerEvents: 'auto',
            opacity: 0.7,
            transition: 'opacity 150ms, transform 150ms',
          }}
        />
      ))}
    </div>
  );
}
