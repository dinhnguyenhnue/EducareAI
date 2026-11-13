import type { Transition, Variants } from "framer-motion";

/**
 * EDUCARE OCEAN DESIGN SYSTEM — Motion Tokens (Section VI)
 * Uses GPU-friendly transform & opacity properties with cubic-bezier(0.22, 1, 0.36, 1).
 */
export const MOTION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const MOTION_DURATION = {
  micro: 0.15, // 120–180ms
  hover: 0.18, // 150–220ms
  modal: 0.24, // 200–300ms
  sidebar: 0.26, // 220–320ms
  page: 0.3, // 250–400ms
  chart: 0.55, // 400–700ms
} as const;

export const OCEAN_TRANSITION: Record<keyof typeof MOTION_DURATION, Transition> = {
  micro: { duration: MOTION_DURATION.micro, ease: MOTION_EASE },
  hover: { duration: MOTION_DURATION.hover, ease: MOTION_EASE },
  modal: { duration: MOTION_DURATION.modal, ease: MOTION_EASE },
  sidebar: { duration: MOTION_DURATION.sidebar, ease: MOTION_EASE },
  page: { duration: MOTION_DURATION.page, ease: MOTION_EASE },
  chart: { duration: MOTION_DURATION.chart, ease: MOTION_EASE },
};

export const SPRING_GENTLE: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 30,
  mass: 0.85,
};

export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: OCEAN_TRANSITION.page,
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: MOTION_DURATION.micro, ease: MOTION_EASE },
  },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: OCEAN_TRANSITION.modal,
  },
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: MOTION_DURATION.hover, ease: MOTION_EASE } },
  exit: { opacity: 0, transition: { duration: MOTION_DURATION.micro, ease: MOTION_EASE } },
};

export const modalPanelVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: OCEAN_TRANSITION.modal },
  exit: { opacity: 0, scale: 0.98, y: 6, transition: OCEAN_TRANSITION.micro },
};

export const drawerSlideVariants: Variants = {
  initial: { x: "-100%", opacity: 0.85 },
  animate: { x: 0, opacity: 1, transition: OCEAN_TRANSITION.sidebar },
  exit: { x: "-100%", opacity: 0.85, transition: OCEAN_TRANSITION.modal },
};

export const drawerRightSlideVariants: Variants = {
  initial: { x: "100%", opacity: 0.85 },
  animate: { x: 0, opacity: 1, transition: OCEAN_TRANSITION.sidebar },
  exit: { x: "100%", opacity: 0.85, transition: OCEAN_TRANSITION.modal },
};

