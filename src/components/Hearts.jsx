import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1];

const PATH =
  "M16 27.4S1.2 18.2 1.2 9.9C1.2 4.6 5.3 1 9.7 1c2.8 0 5.2 1.5 6.3 3.4C17.1 2.5 19.5 1 22.3 1c4.4 0 8.5 3.6 8.5 8.9 0 8.3-14.8 17.5-14.8 17.5Z";

/* Cœurs vectoriels dans le rose structurel de la palette. */
export default function Hearts({ count = 2 }) {
  const reduce = useReducedMotion();

  return (
    <span className="hearts" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="heart"
          initial={reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduce ? { duration: 0 } : { delay: 0.55 + i * 0.14, duration: 0.7, ease: EASE }}
        >
          <svg viewBox="0 0 32 28">
            <path d={PATH} fill="currentColor" />
          </svg>
        </motion.span>
      ))}
    </span>
  );
}
