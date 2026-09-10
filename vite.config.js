import { defineConfig } from 'vite';

export default defineConfig({
  // Chemins relatifs : le build doit tourner tel quel derrière un sous-dossier
  // (Pages) comme à la racine (Netlify, Vercel).
  base: './',
  server: { open: true },
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
