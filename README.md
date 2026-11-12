# 🎂 Joyeux anniversaire Cléa

Site d'anniversaire en une page, pensé mobile d'abord : un gâteau en 3D qu'on fait
tourner au doigt, puis deux diapositives qui se suivent au bouton.

**En ligne :** https://tommy579.github.io/birthday/

## Les pages

1. **Le gâteau** — 18 bougies, cadrage serré, rotation au doigt ou à la souris.
2. **Le message** — « Joyeux anniversaire mon cœur », deux cœurs dessinés.
3. **Le vœu** — « Fais un vœu. », puis « Souffler les bougies » : les flammes
   s'éteignent, la fumée monte, les confettis tombent.
4. **Nous** *(optionnelle)* — apparaît dès que `PHOTOS` n'est plus vide.

Sur grand écran (≥ 900 px, paysage), la mise en page passe en deux colonnes :
le texte à gauche, le gâteau à droite ; la caméra suit dans `FRAMES_WIDE`.

## Architecture

```
src/
  content.js            textes, âge, photos, cadrages caméra (source unique)
  App.jsx               machine à états des pages, clavier, ancres
  slides.jsx            les quatre pages
  scene/
    buildCake.js        géométrie du gâteau (18 bougies, glaçage, cœur)
    CakeScene.jsx       rendu three.js, caméra, interaction, souffle
  components/
    Reveal.jsx          révélation lettre par lettre
    Hearts.jsx          les deux cœurs SVG
    Progress.jsx        filet de progression
    PhotoStrip.jsx      bande de photos
    Confetti.jsx        confettis canvas
  styles/
    tokens.css          palette et typographies
    app.css             mise en page et composants
```

Tous les textes sont dans `src/content.js`. Aucun autre fichier n'en contient.

## Personnaliser

```js
// src/content.js
export const BIRTHDAY = { name: "Cléa", age: 18, signature: "Tom", hearts: 2 };
export const PHOTOS = ["/photos/01.jpg", "/photos/02.jpg"];
```

Dépose les images dans `public/photos/`, ajoute leurs chemins à `PHOTOS`, et la
page « Nous » apparaît automatiquement dans le parcours et dans la progression.

## Développement

```bash
npm install
npm run dev     # http://localhost:5173/birthday/
npm run build   # build de production dans dist/
```

## Déploiement

`.github/workflows/deploy.yml` construit le site et le publie sur GitHub Pages à
chaque `push` sur `main` (source Pages : GitHub Actions).

Le `base: "/birthday/"` de `vite.config.js` doit rester aligné avec le nom du
dépôt, sinon les assets ne se chargent pas.

## Notes techniques

- Rotation : `pointerdown/move/up` + `setPointerCapture`, `touch-action: none`,
  `user-select: none`, `overscroll-behavior: none`.
- La scène 3D reste montée entre les pages : seule la caméra change de cadrage.
- Rendu en pause hors écran (`IntersectionObserver`) et onglet caché.
- `prefers-reduced-motion` : plus de rotation automatique, de scintillement ni
  de révélation lettre par lettre.
- DPR plafonné à 2, géométries instanciées (vermicelles, coulures, perles).
- Ancres `#hero`, `#message`, `#wish` : un lien partagé ouvre la bonne page.
