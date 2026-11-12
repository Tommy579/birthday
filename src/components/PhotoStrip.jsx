/* Bande de photos, défilement horizontal au doigt.
   Ne s'affiche que si la liste n'est pas vide.

   Les chemins de content.js s'écrivent « /photos/01.jpg ».
   On ajoute le préfixe du site (import.meta.env.BASE_URL) pour
   qu'ils restent valides sur GitHub Pages comme en local. */
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
          alt=""
          loading={i < 2 ? "eager" : "lazy"}
          role="listitem"
        />
      ))}
    </div>
  );
}
