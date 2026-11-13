import { COPY } from "../content.js";

/* Barre d'étapes interactive : permet de se repérer et de revenir ou avancer directement. */
export default function Progress({ slides, index, onSelect }) {
  return (
    <nav className="steps" aria-label="Étapes">
      {slides.map((id, i) => {
        const active = i === index;
        const label = COPY.nav[id] || id;
        return (
          <button
            key={id}
            type="button"
            className={`step ${active ? "is-active" : ""} ${i < index ? "is-done" : ""}`}
            aria-current={active ? "step" : undefined}
            onClick={() => onSelect(i)}
          >
            <span className="step-num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="step-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
