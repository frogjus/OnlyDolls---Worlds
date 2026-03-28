import type { JSONContent } from '@tiptap/core';

export function extractText(node: JSONContent): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(extractText).join('');
}

export function tipTapToFountain(doc: JSONContent): string {
  const lines: string[] = [];

  for (const node of doc.content ?? []) {
    switch (node.type) {
      case 'screenplaySlugline': {
        const text = extractText(node);
        const sceneNum = node.attrs?.sceneNumber;
        lines.push('');
        lines.push(sceneNum ? `${text} #${sceneNum}#` : text);
        break;
      }

      case 'screenplayAction':
        lines.push('');
        lines.push(extractText(node));
        break;

      case 'screenplayCharacter': {
        const text = extractText(node);
        const dual = node.attrs?.isDualDialogue;
        lines.push('');
        lines.push(dual ? `${text} ^` : text);
        break;
      }

      case 'screenplayDialogue':
        lines.push(extractText(node));
        break;

      case 'screenplayParenthetical':
        lines.push(extractText(node));
        break;

      case 'screenplayTransition':
        lines.push('');
        lines.push(`> ${extractText(node)}`);
        break;

      case 'horizontalRule':
        lines.push('');
        lines.push('===');
        break;

      case 'heading': {
        const level = (node.attrs?.level as number) ?? 1;
        const text = extractText(node);
        lines.push('');
        lines.push(`${'#'.repeat(level)} ${text}`);
        break;
      }

      default: {
        const text = extractText(node);
        if (text.trim()) {
          lines.push('');
          lines.push(text);
        }
      }
    }
  }

  return lines.join('\n').trim() + '\n';
}
