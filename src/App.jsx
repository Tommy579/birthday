import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import CakeScene from "./scene/CakeScene.jsx";
import Confetti from "./components/Confetti.jsx";
import Progress from "./components/Progress.jsx";
import { Hero, Message, Photos, Wish } from "./slides.jsx";
import { BIRTHDAY, COPY, PHOTOS } from "./content.js";

/* La page « Nous » n'apparaît que si des photos sont déclarées. */
const SLIDES = ["hero", "message", ...(PHOTOS.length ? ["photos"] : []), "wish"];

export default function App() {
  const [index, setIndex] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    const found = SLIDES.indexOf(hash);
    return found >= 0 ? found : 0;
  });
  const [blown, setBlown] = useState(false);
  const [flash, setFlash] = useState(false);
  const [interacted, setInteracted] = useState(false);

  const slide = SLIDES[index] ?? "hero";
  const interactive = slide === "hero" || slide === "wish";

  /* chaque page a son ancre et son titre */
  useEffect(() => {
    if (window.location.hash !== `#${slide}`) {
      window.history.replaceState(null, "", `#${slide}`);
    }
    const baseTitle = `Joyeux anniversaire ${BIRTHDAY.name}`;
    const stepLabel = COPY.nav[slide];
    document.title = slide === "hero" ? baseTitle : `${stepLabel} | ${baseTitle}`;
  }, [slide]);

  /* un lien partagé ouvre directement la bonne page, et le
     bouton retour du navigateur suit les ancres */
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace("#", "");
      const found = SLIDES.indexOf(hash);
      if (found >= 0) setIndex(found);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const blow = useCallback(() => {
    setBlown(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 320);
    if (navigator.vibrate) navigator.vibrate([18, 60, 26]);
  }, []);

  const restart = useCallback(() => {
    setBlown(false);
    setIndex(0);
  }, []);

  const onPrimary = useCallback(() => {
    if (slide !== "wish") next();
    else if (!blown) blow();
    else restart();
  }, [slide, blown, next, blow, restart]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("button, a, input, textarea, [role='list']")) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const label =
    slide === "wish" ? (blown ? COPY.wish.again : COPY.wish.cta) : COPY.next;

  return (
    <main className={`app ${flash ? "is-flashing" : ""}`}>
      <div className="bg" aria-hidden="true" />

      <div className={`stage ${interactive ? "is-interactive" : ""}`}>
        <CakeScene
          frame={slide}
          interactive={interactive}
          blown={blown}
          onInteract={() => setInteracted(true)}
        />
      </div>

      <div className="scrim" aria-hidden="true" />

      <div className="ui">
        <header className="topbar">
          <span className="brand">{BIRTHDAY.name}</span>
          <Progress slides={SLIDES} index={index} onSelect={setIndex} />
        </header>

        <div className="content">
          <AnimatePresence mode="wait" initial={false}>
            {slide === "hero" && <Hero key="hero" interacted={interacted} />}
            {slide === "message" && <Message key="message" />}
            {slide === "photos" && <Photos key="photos" photos={PHOTOS} />}
            {slide === "wish" && <Wish key="wish" blown={blown} />}
          </AnimatePresence>
        </div>

        <footer className="dock">
          {index > 0 && (
            <button className="btn-secondary" type="button" onClick={prev}>
              {COPY.back}
            </button>
          )}
          <button className="cta" type="button" onClick={onPrimary}>
            {label}
          </button>
        </footer>
      </div>

      {blown && <Confetti />}
    </main>
  );
}
