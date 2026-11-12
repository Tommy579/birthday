import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import CakeScene from "./CakeScene.jsx";
import Confetti from "./Confetti.jsx";

/* ── textes : tout se modifie ici ─────────────────────────── */
const COPY = {
  signature: "Tom",
  slide0: {
    eyebrow: "Pour toi",
    title: "Fais tourner\nmon gâteau",
    hint: "Glisse ton doigt — ou ta souris — pour le voir de tous les côtés.",
  },
  slide1: {
    title: "JOYEUX ANNIVERSAIRE MON CŒUR",
    sub: "Une année de plus à te trouver la plus belle.",
  },
  slide2: {
    title: "Fais un vœu.",
    sub: "Ce que tu veux. Même le plus fou.",
    done: "Vœu exaucé.",
    doneSub:
      "Que cette année te ressemble :\ndouce, lumineuse, et pleine de tout ce que tu mérites.",
  },
};

const EASE = [0.16, 1, 0.3, 1];
const SLIDE_COUNT = 3;

function Reveal({ text, delay = 0, className = "" }) {
  const words = useMemo(() => text.split("\n").map((line) => line.split(" ")), [text]);
  const label = text.replace(/\n/g, " ");
  let n = 0;
  return (
    <span className={className} aria-label={label}>
      {words.map((line, li) => (
        <span className="line" key={li} aria-hidden="true">
          {line.map((word, wi) => (
            <span className="word" key={wi}>
              {Array.from(word).map((ch) => {
                const d = delay + n * 0.028;
                n += 1;
                return (
                  <motion.span
                    className="ch"
                    key={`${wi}-${ch}-${n}`}
                    initial={{ opacity: 0, y: "0.45em" }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, delay: d, ease: EASE }}
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

function Hearts() {
  return (
    <span className="hearts" aria-hidden="true">
      <motion.span
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
      >
        💖
      </motion.span>
      <motion.span
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.05, duration: 0.9, ease: EASE }}
      >
        💖
      </motion.span>
    </span>
  );
}

const slideVariants = {
  enter: { opacity: 0, y: 28 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function App() {
  const [index, setIndex] = useState(0);
  const [blown, setBlown] = useState(false);
  const [flash, setFlash] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, SLIDE_COUNT - 1));
  }, []);

  const blow = useCallback(() => {
    setBlown(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 260);
    if (navigator.vibrate) navigator.vibrate([18, 60, 26]);
  }, []);

  const restart = useCallback(() => {
    setBlown(false);
    setIndex(0);
  }, []);

  const onPrimary = () => {
    if (index < SLIDE_COUNT - 1) next();
    else if (!blown) blow();
    else restart();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowRight", "ArrowDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        onPrimary();
      } else if (e.key === "ArrowLeft" && !blown) {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const label =
    index < SLIDE_COUNT - 1 ? "Continuer" : blown ? "Revoir depuis le début" : "Souffler les bougies";

  return (
    <main className={`app ${flash ? "is-flashing" : ""}`}>
      <div className="aurora" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={index + 1}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <span key={i} className={`seg ${i <= index ? "on" : ""}`} />
          ))}
        </div>
      </header>

      <div className="content">
        <div className={`stage ${index === 0 ? "on" : ""}`}>
          <CakeScene active={index === 0} />
        </div>

        <AnimatePresence initial={false}>
          {index === 0 && (
            <motion.section
              key="s0"
              className="slide slide-0"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: EASE }}
            >
              <p className="eyebrow">
                <span className="dot" aria-hidden="true" />
                {COPY.slide0.eyebrow}
              </p>
              <h1 className="title">
                <Reveal text={COPY.slide0.title} delay={0.15} />
              </h1>
              <p className="hint">{COPY.slide0.hint}</p>
            </motion.section>
          )}

          {index === 1 && (
            <motion.section
              key="s1"
              className="slide slide-1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: EASE }}
            >
              <h2 className="big-title">
                <Reveal text={COPY.slide1.title} delay={0.1} />
                <Hearts />
              </h2>
              <motion.p
                className="sub"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 1 }}
              >
                {COPY.slide1.sub}
              </motion.p>
              <motion.span
                className="rule"
                aria-hidden="true"
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1.35, duration: 1.1, ease: EASE }}
              />
            </motion.section>
          )}

          {index === 2 && (
            <motion.section
              key="s2"
              className="slide slide-2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: EASE }}
            >
              <AnimatePresence initial={false}>
                {!blown ? (
                  <motion.div
                    key="wish"
                    className="wish"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.6, ease: EASE }}
                  >
                    <div className="flame-icon" aria-hidden="true">
                      <span className="flick" />
                    </div>
                    <h2 className="big-title short">
                      <Reveal text={COPY.slide2.title} delay={0.1} />
                    </h2>
                    <p className="sub">{COPY.slide2.sub}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="done"
                    className="wish done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.9, ease: EASE }}
                  >
                    <motion.h2
                      className="big-title short glow"
                      initial={{ opacity: 0, y: 18, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.9, ease: EASE }}
                    >
                      {COPY.slide2.done}
                    </motion.h2>
                    <motion.p
                      className="sub"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.9, ease: EASE }}
                    >
                      {COPY.slide2.doneSub.split("\n").map((l) => (
                        <span className="sub-line" key={l}>
                          {l}
                        </span>
                      ))}
                    </motion.p>
                    <motion.p
                      className="signature"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9, duration: 0.8 }}
                    >
                      — {COPY.signature}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
              {blown && <Confetti />}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <footer className="dock">
        <button className="cta" type="button" onClick={onPrimary}>
          {label}
        </button>
        {index === 0 && <span className="dock-hint">1 / 3</span>}
      </footer>
    </main>
  );
}
