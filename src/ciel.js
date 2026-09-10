import Phaser from 'phaser';
import { LARGEUR, HAUTEUR } from './constantes.js';

// Trois nappes d'étoiles à des vitesses différentes : la profondeur ne coûte
// rien de plus qu'une addition par étoile.
const NAPPES = [
  { quantite: 26, vitesse: 12, alpha: 0.3 },
  { quantite: 16, vitesse: 28, alpha: 0.6 },
  { quantite: 10, vitesse: 48, alpha: 1 },
];

export function creerCiel(scene) {
  const etoiles = [];

  NAPPES.forEach((nappe) => {
    for (let i = 0; i < nappe.quantite; i += 1) {
      const etoile = scene.add
        .image(Phaser.Math.Between(0, LARGEUR), Phaser.Math.Between(0, HAUTEUR), 'etoile')
        .setAlpha(nappe.alpha)
        .setDepth(-10);
      etoile.vitesse = nappe.vitesse;
      etoiles.push(etoile);
    }
  });

  return {
    defiler(delta) {
      etoiles.forEach((etoile) => {
        etoile.y += (etoile.vitesse * delta) / 1000;
        if (etoile.y > HAUTEUR) {
          etoile.y -= HAUTEUR;
          etoile.x = Phaser.Math.Between(0, LARGEUR);
        }
      });
    },
  };
}
