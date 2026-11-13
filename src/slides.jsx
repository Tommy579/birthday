import { motion, useReducedMotion } from "motion/react";
import Reveal from "./components/Reveal.jsx";
import Hearts from "./components/Hearts.jsx";
import PhotoStrip from "./components/PhotoStrip.jsx";
import { BIRTHDAY, COPY } from "./content.js";

const EASE = [0.16, 1, 0.3, 1];

const variants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
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
      transition={reduce ? { duration: 0 } : { duration: 0.48, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

/* Petit pictogramme de rotation, dessiné en SVG. */
function TurnIcon() {
  return (
    <svg className="hint-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.5 12a8.5 8.5 0 1 1-2.5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M20.5 3.5V9H15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hero({ interacted }) {
  return (
    <Slide>
      <p className="kicker">{COPY.hero.kicker}</p>
      <h1 className="name">
        <Reveal text={COPY.hero.title} delay={0.08} />
      </h1>
      <p className={`hint ${interacted ? "is-quiet" : ""}`}>
        <TurnIcon />
        <span>{COPY.hero.hint}</span>
      </p>
    </Slide>
  );
}

export function Message() {
  return (
    <Slide>
      <h1 className="headline">
        <span className="eyebrow">
          <Reveal text={COPY.message.eyebrow} delay={0.04} />
        </span>
        <span className="lead">
          <Reveal text={COPY.message.lead} delay={0.14} />
        </span>
        <span className="accent">
          <Reveal text={COPY.message.accent} delay={0.28} />
        </span>
        <Hearts count={BIRTHDAY.hearts} />
      </h1>
    </Slide>
  );
}

export function Photos({ photos }) {
  return (
    <Slide>
      <h1 className="title">{COPY.photos.title}</h1>
      <p className="subtitle">{COPY.photos.subtitle}</p>
      <PhotoStrip photos={photos} />
    </Slide>
  );
}

export function Aside() {
  return (
    <Slide>
      <div className="aside-wrap">
        <h1 className="aside-text">{COPY.aside.text}</h1>
      </div>
    </Slide>
  );
}

export function Wish() {
  return (
    <Slide>
      <div className="wish">
        <h1 className="title">{COPY.wish.title}</h1>
        <p className="subtitle">{COPY.wish.subtitle}</p>
      </div>
    </Slide>
  );
}

export function Done() {
  return (
    <Slide>
      <div className="done-wrap">
        <div className="wish">
          <h1 className="title done">{COPY.wish.done}</h1>
          <p className="signature">{BIRTHDAY.signature}</p>
        </div>
        <div className="done-notes">
          <p>{COPY.wish.note1}</p>
          <p>{COPY.wish.note2}</p>
        </div>
      </div>
    </Slide>
  );
}
