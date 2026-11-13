/* Bande de photos, défilement horizontal au doigt.
   Ne s'affiche que si la liste n'est pas vide. */
const BASE = import.meta.env.BASE_URL || "/";

function resolve(src) {
  if (!src) return src;
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  const clean = src.replace(/^\/+/, "");
  return `${BASE.replace(/\/+$/, "")}/${clean}`;
}

export default function PhotoStrip({ photos }) {
  if (!photos?.length) return null;

  return (
    <div className="strip" role="list">
      {photos.map((src, i) => (
        <img
          key={src}
          src={resolve(src)}
          alt={`Souvenir ${i + 1}`}
          loading={i < 2 ? "eager" : "lazy"}
          role="listitem"
        />
      ))}
    </div>
  );
}
