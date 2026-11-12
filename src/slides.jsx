import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Reveal from "./components/Reveal.jsx";
import Hearts from "./components/Hearts.jsx";
import PhotoStrip from "./components/PhotoStrip.jsx";
import { BIRTHDAY, COPY } from "./content.js";

const EASE = [0.16, 1, 0.3, 1];

const variants = {
  enter: { opacity: 0, y: 24 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
};

/* Une page : fondu + glissement, instantané si l'utilisateur
   a demandé moins d'animation. */
function Slide({ children }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className="slide"
      variants={variants}
      initial={reduce ? false : "enter"}
      animate="center"
      exit="exit"
      transition={reduce ? { duration: 0 } : { duration: 0.55, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

/* Petit pictogramme de rotation, dessiné plutôt qu'un caractère. */
function TurnIcon() {
  return (
    <svg className="hint-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.5 12a8.5 8.5 0 1 1-2.5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M20.5 3.5V9H15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <Slide>
      <p className="kicker">{COPY.hero.kicker}</p>
      <h1 className="name">
        <Reveal text={COPY.hero.title} delay={0.12} />
      </h1>
      <p className="hint">
        <TurnIcon />
        {COPY.hero.hint}
      </p>
    </Slide>
  );
}

export function Message() {
  return (
    <Slide>
      <h2 className="headline">
        <span className="eyebrow">
          <Reveal text={COPY.message.eyebrow} delay={0.04} />
        </span>
        <span className="lead">
          <Reveal text={COPY.message.lead} delay={0.16} />
        </span>
        <span className="accent">
          <Reveal text={COPY.message.accent} delay={0.32} />
        </span>
        <Hearts count={BIRTHDAY.hearts} />
      </h2>
    </Slide>
  );
}

export function Photos({ photos }) {
  return (
    <Slide>
      <h2 className="title">{COPY.photos.title}</h2>
      <PhotoStrip photos={photos} />
    </Slide>
  );
}

export function Wish({ blown }) {
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : { duration: 0.6, ease: EASE };

  return (
    <Slide>
      <AnimatePresence mode="wait" initial={false}>
        {!blown ? (
          <motion.div
            key="wish"
            className="wish"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={t}
          >
            <h2 className="title">{COPY.wish.title}</h2>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            className="wish"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t}
          >
            <h2 className="title done">{COPY.wish.done}</h2>
            <p className="signature">— {BIRTHDAY.signature}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Slide>
  );
}
