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
    done: "Vœu exaucé.",
    cta: "Souffler les bougies",
    again: "Revoir",
  },
  photos: {
    title: "Nous.",
  },
  next: "Continuer",
};

/* Dépose des photos dans public/photos/ puis liste-les ici :
   ["/photos/01.jpg", "/photos/02.jpg"].
   Tant que la liste est vide, la page « Nous » n'existe pas. */
export const PHOTOS = [];

/* Cadrage de la caméra 3D, page par page.
   top   hauteur du sommet du gâteau, en fraction de l'écran
   size  hauteur du gâteau, en fraction de l'écran
   pitch inclinaison de la caméra, rad
   spin  rotation automatique, rad/s
   expo  exposition du rendu */
/* Mobile : le texte est au-dessus, le gâteau en dessous. */
export const FRAMES = {
  hero: { top: 0.28, size: 0.37, pitch: 0.28, spin: 0.14, expo: 0.76 },
  message: { top: 0.37, size: 0.34, pitch: 0.4, spin: 0.05, expo: 0.6 },
  wish: { top: 0.28, size: 0.34, pitch: 0.22, spin: 0.09, expo: 0.84 },
  photos: { top: 0.56, size: 0.24, pitch: 0.42, spin: 0.04, expo: 0.5 },
};

/* Grand écran : deux colonnes. Le texte tient la gauche, le
   gâteau la droite. x = décalage du gâteau, en fraction de la
   largeur visible, positif vers la droite. */
export const FRAMES_WIDE = {
  hero: { top: 0.2, size: 0.6, pitch: 0.3, spin: 0.14, expo: 0.9, x: 0.2 },
  message: { top: 0.24, size: 0.54, pitch: 0.42, spin: 0.05, expo: 0.7, x: 0.2 },
  wish: { top: 0.2, size: 0.54, pitch: 0.26, spin: 0.09, expo: 0.95, x: 0.2 },
  photos: { top: 0.16, size: 0.6, pitch: 0.44, spin: 0.04, expo: 0.55, x: 0.2 },
};

/* À partir de cette largeur, on passe en deux colonnes. */
export const WIDE_MIN = 900;

/* Le gâteau mesure 2,54 unités de haut, du pied au sommet du cœur. */
export const CAKE_TOP = 2.54;
