const picModules = import.meta.glob(
  "../pics/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}",
  { eager: true, import: "default" }
);

const PICS = Object.entries(picModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src);

/* ══════════════════════════════════════════════════════════
   Source unique : textes, réglages et photos du site.
   Aucun autre fichier ne contient de contenu éditorial.
   ══════════════════════════════════════════════════════════ */

export const BIRTHDAY = {
  name: "Cléa",
  age: 18,
  signature: "Tom",
  hearts: 2,
};

/* Le texte est réduit au minimum : un mot par intention. */
export const COPY = {
  hero: {
    kicker: `${BIRTHDAY.age} ans`,
    title: BIRTHDAY.name,
    hint: "Fais-le tourner",
  },
  message: {
    eyebrow: "Joyeux",
    lead: "Anniversaire",
    accent: "Mon cœur",
  },
  wish: {
    title: "Fais un vœu.",
    subtitle: `Souffle les ${BIRTHDAY.age} bougies quand tu es prête.`,
    done: "Vœu exaucé.",
    cta: "Souffler les bougies",
    again: "Revoir",
  },
  photos: {
    title: "Nous.",
    subtitle: "Quelques moments passés ensemble, en attendant tous les prochains 🥰",
  },
  nav: {
    hero: "Gâteau",
    message: "Message",
    photos: "Nous",
    wish: "Vœu",
  },
  back: "Retour",
  next: "Continuer",
};

/* Photos importées depuis pics/ à la racine du dépôt. */
export const PHOTOS = PICS;

/* Cadrage de la caméra 3D, page par page.
   top   hauteur du sommet du gâteau, en fraction de l'écran
   size  hauteur du gâteau, en fraction de l'écran
   pitch inclinaison de la caméra, rad
   spin  rotation automatique, rad/s
   expo  exposition du rendu */
/* Mobile : le texte est au-dessus, le gâteau en dessous. */
export const FRAMES = {
  hero: { top: 0.35, size: 0.34, pitch: 0.28, spin: 0.14, expo: 0.85 },
  message: { top: 0.41, size: 0.32, pitch: 0.4, spin: 0.05, expo: 0.78 },
  wish: { top: 0.32, size: 0.34, pitch: 0.22, spin: 0.09, expo: 0.88 },
  photos: { top: 0.65, size: 0.21, pitch: 0.42, spin: 0.04, expo: 0.76 },
};

/* Grand écran : deux colonnes. Le texte tient la gauche, le
   gâteau la droite. x = décalage du gâteau, en fraction de la
   largeur visible, positif vers la droite. */
export const FRAMES_WIDE = {
  hero: { top: 0.2, size: 0.6, pitch: 0.3, spin: 0.14, expo: 0.86, x: 0.2 },
  message: { top: 0.24, size: 0.54, pitch: 0.42, spin: 0.05, expo: 0.8, x: 0.2 },
  wish: { top: 0.2, size: 0.54, pitch: 0.26, spin: 0.09, expo: 0.9, x: 0.2 },
  photos: { top: 0.18, size: 0.58, pitch: 0.42, spin: 0.04, expo: 0.8, x: 0.2 },
};

/* À partir de cette largeur, on passe en deux colonnes. */
export const WIDE_MIN = 900;

/* Le gâteau mesure 2,54 unités de haut, du pied au sommet du cœur. */
export const CAKE_TOP = 2.54;
