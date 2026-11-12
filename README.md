# 🎂 Joyeux anniversaire mon cœur

Site d'anniversaire en une page, pensé mobile d'abord : un gâteau en 3D qu'on fait
tourner au doigt, puis deux diapositives qui se suivent au bouton.

**En ligne :** https://tommy579.github.io/birthday/

## Les trois diapositives

1. **Le gâteau** — gâteau 3D généré en three.js (deux étages, glaçage coulant,
   vermicelles, bougies animées, cœur doré). Rotation au doigt ou à la souris,
   avec inertie, sans sélection de texte ni zoom accidentel.
2. **Le texte** — « JOYEUX ANNIVERSAIRE MON CŒUR 💖💖 » en lettrage dégradé,
   apparition lettre par lettre.
3. **Le vœu** — « Fais un vœu. », puis « Souffler les bougies » : flash, confettis
   et cœurs, message final signé.

## Personnaliser

Tous les textes sont regroupés en haut de `src/App.jsx` :

```js
const COPY = {
  signature: "Tom",
  slide0: { eyebrow: "Pour toi", ... },
  slide1: { title: "JOYEUX ANNIVERSAIRE MON CŒUR", ... },
  slide2: { title: "Fais un vœu.", done: "Vœu exaucé.", ... },
};
```

La palette est déclarée une seule fois, en tête de `src/styles.css`
(deux couleurs calmes + une couleur forte, dosées 60/30/10) et reprise dans
`src/CakeScene.jsx` pour les matières 3D.

## Développement

```bash
npm install
npm run dev     # http://localhost:5173/birthday/
npm run build   # build de production dans dist/
```

## Déploiement

`.github/workflows/deploy.yml` construit le site et le publie sur GitHub Pages
à chaque `push` sur `main` (source Pages : GitHub Actions).

Le `base: "/birthday/"` de `vite.config.js` doit rester aligné avec le nom du
dépôt, sinon les assets ne se chargent pas.

## Notes techniques

- Rotation : `pointerdown/move/up` + `setPointerCapture`, `touch-action: none`
  sur le canvas, `user-select: none` + `overscroll-behavior: none` sur la page.
- Rendu mis en pause hors écran (`IntersectionObserver`) et onglet caché.
- `prefers-reduced-motion` : plus de rotation automatique ni de scintillement.
- DPR plafonné à 2, géométries instanciées (vermicelles, coulures, perles).
