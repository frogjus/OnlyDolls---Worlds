import type { Variants, Transition } from 'framer-motion'

// ─── Shared Transitions ─────────────────────────────────────────────

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 24,
}

// ─── Page Transitions ────────────────────────────────────────────────

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
  },
}

// ─── Card Hover (subtle lift + glow) ─────────────────────────────────

export const cardHover: Variants = {
  rest: {
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  },
  hover: {
    y: -2,
    scale: 1.01,
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
}

// ─── List Stagger ────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
}

// ─── Sidebar Slide ───────────────────────────────────────────────────

export const sidebarSlide: Variants = {
  expanded: {
    width: 260,
    transition: {
      duration: 0.3,
      ease: [0, 0, 0.2, 1],
      when: 'beforeChildren',
    },
  },
  collapsed: {
    width: 48,
    transition: {
      duration: 0.25,
      ease: [0, 0, 0.2, 1],
      when: 'afterChildren',
    },
  },
}

export const sidebarContent: Variants = {
  expanded: {
    opacity: 1,
    transition: { duration: 0.2, delay: 0.1 },
  },
  collapsed: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

// ─── Section Collapse (accordion) ────────────────────────────────────

export const sectionCollapse: Variants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: [0, 0, 0.2, 1] },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.25, ease: [0, 0, 0.2, 1] },
      opacity: { duration: 0.15 },
    },
  },
}

// ─── Modal / Dialog ──────────────────────────────────────────────────

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
  },
}

// ─── Fade In ─────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

// ─── Scale In (for cards appearing) ──────────────────────────────────

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
}

// ─── Glow Pulse (for teal accent elements) ───────────────────────────

export const glowPulse: Variants = {
  rest: {
    boxShadow: '0 0 0px rgba(20, 184, 166, 0)',
  },
  glow: {
    boxShadow: [
      '0 0 8px rgba(20, 184, 166, 0.15)',
      '0 0 20px rgba(20, 184, 166, 0.25)',
      '0 0 8px rgba(20, 184, 166, 0.15)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ─── Drag Animations (for beat cards) ────────────────────────────────

export const dragCard: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  dragging: {
    scale: 1.03,
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
}

// ─── Skeleton Shimmer ────────────────────────────────────────────────

export const shimmer: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0, 0, 0.2, 1],
    },
  }),
}

// ─── Scroll-triggered items ──────────────────────────────────────────

export const scrollReveal: Variants = {
  offscreen: { opacity: 0, y: 16 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0, 0, 0.2, 1],
    },
  },
}
