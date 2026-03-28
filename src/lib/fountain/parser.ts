import { Fountain } from 'fountain-js';
import type { JSONContent } from '@tiptap/core';
import type { FountainParseResult, FountainToken } from './types';

const fountain = new Fountain();

function titlePageField(tokens: FountainToken[], type: string): string {
  const token = tokens.find((t) => t.type === type);
  return token?.text ?? '';
}

export function parseFountain(source: string): FountainParseResult {
  const result = fountain.parse(source, true);
  const tokens: FountainToken[] = (result.tokens ?? []).map((t) => ({
    type: t.type,
    text: t.text ?? '',
    ...(t.scene_number != null && { scene_number: t.scene_number }),
    ...(t.depth != null && { depth: t.depth }),
    ...(t.dual != null && { dual: t.dual }),
  }));

  const titleTokens = tokens.filter((t) => (t as FountainToken & { is_title?: boolean }).type !== undefined);

  return {
    title: result.title ?? titlePageField(titleTokens, 'title'),
    credit: titlePageField(tokens, 'credit'),
    author: titlePageField(tokens, 'author') || titlePageField(tokens, 'authors'),
    source: titlePageField(tokens, 'source'),
    tokens,
  };
}

export function fountainToTipTap(source: string): JSONContent {
  const parsed = fountain.parse(source, true);
  const content: JSONContent[] = [];

  let currentDual: string | undefined;

  for (const token of parsed.tokens ?? []) {
    switch (token.type) {
      case 'scene_heading':
        content.push({
          type: 'screenplaySlugline',
          attrs: {
            sceneNumber: token.scene_number ?? null,
          },
          content: token.text ? [{ type: 'text', text: token.text }] : undefined,
        });
        break;

      case 'action':
        if (token.text?.trim()) {
          content.push({
            type: 'screenplayAction',
            content: [{ type: 'text', text: token.text }],
          });
        }
        break;

      case 'dialogue_begin':
        currentDual = token.dual;
        break;

      case 'character':
        content.push({
          type: 'screenplayCharacter',
          attrs: {
            isDualDialogue: currentDual === 'right',
          },
          content: token.text ? [{ type: 'text', text: token.text }] : undefined,
        });
        break;

      case 'dialogue':
        content.push({
          type: 'screenplayDialogue',
          content: token.text ? [{ type: 'text', text: token.text }] : undefined,
        });
        break;

      case 'parenthetical':
        content.push({
          type: 'screenplayParenthetical',
          content: token.text ? [{ type: 'text', text: token.text }] : undefined,
        });
        break;

      case 'transition':
        content.push({
          type: 'screenplayTransition',
          content: token.text ? [{ type: 'text', text: token.text }] : undefined,
        });
        break;

      case 'page_break':
        content.push({ type: 'horizontalRule' });
        break;

      case 'section':
        content.push({
          type: 'heading',
          attrs: { level: token.depth ?? 1 },
          content: token.text ? [{ type: 'text', text: token.text }] : undefined,
        });
        break;

      case 'centered':
        if (token.text?.trim()) {
          content.push({
            type: 'screenplayAction',
            attrs: { centered: true },
            content: [{ type: 'text', text: token.text }],
          });
        }
        break;

      case 'lyrics':
        if (token.text?.trim()) {
          content.push({
            type: 'paragraph',
            attrs: { lyrics: true },
            content: [{ type: 'text', text: token.text }],
          });
        }
        break;

      case 'dialogue_end':
      case 'dual_dialogue_begin':
      case 'dual_dialogue_end':
      case 'synopsis':
      case 'boneyard_begin':
      case 'boneyard_end':
      case 'note':
      case 'spaces':
        break;

      default:
        if (token.text?.trim()) {
          content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: token.text }],
          });
        }
    }
  }

  return { type: 'doc', content };
}
