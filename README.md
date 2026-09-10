# Les Skapitaines — Airlines

Shoot'em up vertical en pixel art, clin d'œil au groupe de ska
**Les Skapitaines**. Compagnie aérienne fictive : les niveaux sont des vols,
les ennemis des appareils rivaux, et le score ne compte que les dégâts
infligés.

## Jouer

Flèches pour piloter, espace pour tirer. Trois vols, trois boss, chacun avec
sa manière de tenir l'air et d'ouvrir le feu. Ce qui tombe du ciel n'est pas
toujours bon à ramasser — la moitié des largages sont des malus.

## Développement

Le shell doit être en **Node 22** (voir `.nvmrc`) : Vite 8 casse en dessous
sur une erreur qui ne parle pas de version.

```bash
nvm use
npm install
npm run dev      # serveur de développement
npm run build    # build statique dans dist/
npm run preview  # sert le build de production
```

## Ce qui est généré en code

En attendant de vrais assets, tout est peint ou synthétisé au chargement :

- **les sprites** dans `src/scenes/Preload.js` — un pochoir par appareil,
  portrait, boss et bonus, un caractère par pixel ;
- **les bruitages** dans `src/sons.js` — une recette par son, rendue en
  tampon WebAudio.

Seule la musique est un vrai fichier (`public/audio/`), et le logo peut en
être un : déposer `public/logo.png` puis passer `LOGO_IMPORTE` à `true` dans
`src/constantes.js`.

## Déploiement

Poussé sur `main`, le jeu se construit et part sur GitHub Pages tout seul
(`.github/workflows/pages.yml`). Le `base: './'` de `vite.config.js` rend le
bundle indifférent au chemin : il tourne aussi bien sous
`user.github.io/depot/` qu'à la racine d'un domaine.

Les décisions d'architecture et les pièges rencontrés sont consignés dans
`CLAUDE.md`.
