// Source unique de vérité pour les personnages : écran de sélection, jauges
// et sprite du joueur en découlent tous. Ajouter un pilote ici suffit, aucune
// scène n'a besoin d'être touchée.
//
// Un pilote n'apporte que la moitié de l'équation : ses stats de base et sa
// livrée. L'appareil choisi corrige le reste, voir appareils.js.
//
// stats : entiers de 1 à 5, affichés tels quels en jauges et convertis en
// valeurs de jeu par les fonctions plus bas.
//
// photo : à true, le portrait est chargé depuis public/portraits/<id>.png
// au lieu d'être peint au pochoir dans Preload.js. Les deux cohabitent, on
// peut donc basculer les pilotes un par un.
export const PILOTES = [
  {
    id: 'alex',
    photo: true,
    nom: 'ALEX',
    instrument: 'Pilote',
    couleur: 0x4fa3d9,
    ombre: 0x2b5f80,
    peau: 0xe8b48a,
    stats: { vitesse: 4, cadence: 3, blindage: 1 },
  },
  {
    id: 'rafu',
    photo: false,
    nom: 'RAFU',
    instrument: 'Co-pilote',
    couleur: 0xe0803a,
    ombre: 0x8a4a1c,
    peau: 0xc98a5e,
    stats: { vitesse: 2, cadence: 5, blindage: 3 },
  },
  {
    id: 'gabi',
    photo: false,
    nom: 'GABI',
    instrument: 'Co-pilote',
    couleur: 0x6fd08c,
    ombre: 0x2f7a49,
    peau: 0x8a5a3c,
    stats: { vitesse: 2, cadence: 5, blindage: 3 },
  },
  {
    id: 'wilou',
    photo: false,
    nom: 'WILOU',
    instrument: 'Agent de piste',
    couleur: 0xc98adf,
    ombre: 0x6d3f80,
    peau: 0xf0c9a0,
    stats: { vitesse: 1, cadence: 3, blindage: 5 },
  },
];

export const STATS = [
  { cle: 'vitesse', libelle: 'VITESSE' },
  { cle: 'cadence', libelle: 'CADENCE' },
  { cle: 'blindage', libelle: 'BLINDAGE' },
];

export function pilote(id) {
  return PILOTES.find((p) => p.id === id) ?? PILOTES[0];
}

export function portrait(p) {
  return `portrait_${p.id}`;
}

// Les trois fonctions ci-dessous prennent les stats déjà combinées avec
// l'appareil (voir equipage.js), jamais celles du pilote seul.
export function vitesseDe(stats) {
  return 70 + stats.vitesse * 22;
}

// Millisecondes entre deux tirs : plus la cadence monte, plus l'attente tombe.
export function cadenceDe(stats) {
  return 420 - stats.cadence * 55;
}

// Durée d'invulnérabilité après un choc, en millisecondes.
export function repitDe(stats) {
  return 600 + stats.blindage * 200;
}
