import { useRef } from "react";

/* Bande de photos, défilement horizontal au doigt ou aux flèches.
   Ne s'affiche que si la liste n'est pas vide. */
const BASE = import.meta.env.BASE_URL || "/";

function resolve(src) {
  if (!src) return src;
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  const base = BASE.replace(/\/+$/, "");
  if (base && src.startsWith(`${base}/`)) return src;
  const clean = src.replace(/^\/+/, "");
  return `${base}/${clean}`;
}

export default function PhotoStrip({ photos }) {
  const stripRef = useRef(null);

  if (!photos?.length) return null;

  const scrollBy = (dir) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.72), behavior: "smooth" });
  };

  return (
    <div className="strip-shell">
      <div className="strip" ref={stripRef} role="list">
        {photos.map((src, i) => (
          <img
            key={src}
            src={resolve(src)}
            alt={`Souvenir ${i + 1}`}
            loading={i < 2 ? "eager" : "lazy"}
            decoding="async"
            role="listitem"
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div className="strip-nav" aria-label="Faire défiler les photos">
          <button
            type="button"
            className="strip-btn"
            aria-label="Photo précédente"
            onClick={() => scrollBy(-1)}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path
                d="M12.5 4.5L7 10l5.5 5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="strip-btn"
            aria-label="Photo suivante"
            onClick={() => scrollBy(1)}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path
                d="M7.5 4.5L13 10l-5.5 5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
