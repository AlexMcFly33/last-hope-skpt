// Les appareils rivaux. Un type porte sa silhouette (pochoir dans Preload.js
// sous la clé ennemi_<id>), sa livrée, sa résistance et sa manière de voler.
// Ajouter un type ici et son pochoir là-bas suffit : les vagues de niveaux.js
// le désignent par son id, aucune scène ne connaît la liste.
//
// pv : tirs encaissés avant de tomber. Comme le score ne compte que les dégâts
// infligés, un appareil coriace rapporte mécaniquement plus qu'un frêle.
//
// vol : sa manière de se déplacer, voir VOLS plus bas.
export const ENNEMIS = [
  {
    id: 'chasseur',
    pv: 1,
    vol: 'droit',
    couleur: 0xd94f4f,
    ombre: 0x7d2a2a,
  },
  // Léger et fuyant : il ne descend jamais en ligne droite.
  {
    id: 'guepe',
    pv: 1,
    vol: 'sinus',
    couleur: 0xe0b03a,
    ombre: 0x8a6a1c,
  },
  // Il pique : lent au départ, intenable une fois lancé.
  {
    id: 'plongeur',
    pv: 2,
    vol: 'plongeon',
    couleur: 0x4fd9c9,
    ombre: 0x246d64,
  },
  // Une barge volante : elle encaisse quatre fois plus que les autres.
  {
    id: 'cargo',
    pv: 4,
    vol: 'droit',
    couleur: 0x93a05b,
    ombre: 0x4e552c,
  },
];

export function typeEnnemi(id) {
  return ENNEMIS.find((e) => e.id === id) ?? ENNEMIS[0];
}

export function ennemiTexture(id) {
  return `ennemi_${id}`;
}

// Comment vole un appareil. `lancer` s'exécute une fois au largage, `piloter`
// à chaque frame — les deux sont facultatifs, un vol droit n'a besoin ni de
// l'un ni de l'autre : la vitesse posée par la vague lui suffit.
export const VOLS = {
  droit: {},

  sinus: {
    // Le déphasage évite que toute une vague se balance au même rythme, ce qui
    // la ferait lire comme un seul bloc.
    lancer: (ennemi, vague) => {
      ennemi.dephasage = Math.random() * 2000;
      ennemi.balancement = Math.abs(vague.derive ?? 0) || 45;
    },
    piloter: (ennemi, temps) => {
      ennemi.setVelocityX(Math.sin((temps + ennemi.dephasage) / 260) * ennemi.balancement);
    },
  },

  plongeon: {
    lancer: (ennemi) => ennemi.setAccelerationY(120),
  },
};

export function vol(id) {
  return VOLS[typeEnnemi(id).vol] ?? VOLS.droit;
}
