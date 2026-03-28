import { Node } from '@tiptap/core';

export const ScreenplaySlugline = Node.create({
  name: 'screenplaySlugline',
  group: 'block',
  content: 'text*',
  defining: true,

  addAttributes() {
    return {
      sceneNumber: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="slugline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'slugline',
      class: 'screenplay-slugline',
    }, 0];
  },
});

export const ScreenplayAction = Node.create({
  name: 'screenplayAction',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="action"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'action',
      class: 'screenplay-action',
    }, 0];
  },
});

export const ScreenplayCharacter = Node.create({
  name: 'screenplayCharacter',
  group: 'block',
  content: 'text*',
  defining: true,

  addAttributes() {
    return {
      isDualDialogue: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="character"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'character',
      class: 'screenplay-character',
    }, 0];
  },
});

export const ScreenplayDialogue = Node.create({
  name: 'screenplayDialogue',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="dialogue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'dialogue',
      class: 'screenplay-dialogue',
    }, 0];
  },
});

export const ScreenplayParenthetical = Node.create({
  name: 'screenplayParenthetical',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="parenthetical"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'parenthetical',
      class: 'screenplay-parenthetical',
    }, 0];
  },
});

export const ScreenplayTransition = Node.create({
  name: 'screenplayTransition',
  group: 'block',
  content: 'text*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="transition"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', {
      ...HTMLAttributes,
      'data-type': 'transition',
      class: 'screenplay-transition',
    }, 0];
  },
});
