// Ce qui traîne dans le ciel et se ramasse en vol. Un bonus est de la donnée :
// son pochoir vit dans Preload.js sous la clé bonus_<id>, son effet est appliqué
// par Vol.ramasser(), et l'écran de tuto en dresse la légende tout seul.
// Ajouter une ligne ici et un pochoir là-bas suffit.
//
// poids : chances relatives au tirage. Un appareil abattu lâche quelque chose
// une fois sur CHANCE_LARGAGE ; le tirage décide alors seulement de quoi. Les
// malus pèsent plus lourd que les bonus : ramasser est un pari, pas un réflexe.
//
// effet : la ligne affichée par le tuto. malus : true la peint en rouge.
export const CHANCE_LARGAGE = 0.26;

export const BONUS = [
  {
    id: 'vie',
    libelle: 'EQUIPAGE FRAIS',
    effet: 'UNE VIE DE PLUS',
    poids: 1,
    malus: false,
  },
  {
    id: 'arme',
    libelle: 'CANONS RENFORCES',
    effet: 'UN CANON DE PLUS',
    poids: 5,
    malus: false,
  },
  {
    id: 'givre',
    libelle: 'GIVRE SUR LES AILES',
    effet: 'ALOURDI ET RALENTI 6S',
    poids: 4,
    malus: true,
  },
  {
    id: 'panne',
    libelle: 'PANNE DE CANON',
    effet: 'UN CANON DE MOINS',
    poids: 3,
    malus: true,
  },
];

// Le givre ne coûte pas de vie : il alourdit l'appareil. La cadence tombe,
// mais c'est surtout l'appareil qui se traîne — c'est ce qu'on sent d'abord
// aux commandes, et ce qui rend le malus lisible sans être injouable.
export const DUREE_GIVRE = 6000;
export const FACTEUR_GIVRE_CADENCE = 2;
export const FACTEUR_GIVRE_VITESSE = 0.55;

// L'échelle d'armement, du plus simple au plus fourni. Les canons sont des
// décalages en x par rapport au nez de l'appareil : un cran de plus, un tir de
// plus. Elle vit ici parce que les bonus sont le seul moyen de la gravir — et
// la panne, le seul moyen de la redescendre.
export const ARMES = [
  { canons: [0] },
  { canons: [-4, 4] },
  { canons: [-7, 0, 7] },
];

export function bonusTexture(id) {
  return `bonus_${id}`;
}

// Le ramassage sonne differemment selon qu'on gagne ou qu'on perd : les scenes
// n'ont pas a connaitre la table pour le savoir.
export function estMalus(id) {
  return BONUS.find((b) => b.id === id)?.malus === true;
}

export function libelleBonus(id) {
  return BONUS.find((b) => b.id === id)?.libelle ?? '';
}

// Tirage pondéré : on parcourt la table en retranchant les poids jusqu'à
// tomber sous zéro. Changer un poids suffit à rendre un bonus plus rare, sans
// avoir à recalculer les autres.
export function tirerBonus() {
  const total = BONUS.reduce((somme, b) => somme + b.poids, 0);
  let reste = Math.random() * total;

  for (const b of BONUS) {
    reste -= b.poids;
    if (reste < 0) return b.id;
  }
  return BONUS[0].id;
}
