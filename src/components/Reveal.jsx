import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1];

/* Révèle un texte lettre par lettre, ligne par ligne.
   text : "\n" sépare les lignes, l'espace sépare les mots. */
export default function Reveal({ text, delay = 0, className = "" }) {
  const reduce = useReducedMotion();
  const lines = useMemo(() => text.split("\n").map((line) => line.split(" ")), [text]);
  const label = text.replace(/\n/g, " ");
  let n = 0;

  return (
    <span className={className} aria-label={label}>
      {lines.map((line, li) => (
        <span className="line" key={li} aria-hidden="true">
          {line.map((word, wi) => (
            <span className="word" key={wi}>
              {Array.from(word).map((ch) => {
                const d = delay + n * 0.026;
                n += 1;
                return (
                  <motion.span
                    className="ch"
                    key={`${wi}-${ch}-${n}`}
                    initial={reduce ? false : { opacity: 0, y: "0.4em" }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.7, delay: d, ease: EASE }}
                  >
                    {ch}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
