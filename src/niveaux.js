import { LARGEUR } from './constantes.js';

// Un vol est un niveau. Il porte son briefing (l'histoire racontée avant le
// décollage), ses vagues scriptées, et le boss qui le referme. Ajouter un vol
// ne demande que son entrée ici et le pochoir de son boss dans Preload.js,
// jamais une ligne de scène.
//
// histoire : une entrée par ligne affichée, révélées une à une par Briefing.
// Une chaîne vide fait respirer le texte. Comme partout dans l'interface, on
// écrit en capitales sans accents : la fonte est un pochoir, pas un traitement
// de texte.
//
// vagues : jouées dans l'ordre. delai = attente avant celle-ci, motif = la
// formation (voir FORMATIONS), vitesse = descente, derive = dérive latérale
// (ou amplitude du balancement pour qui vole en sinus), ennemi = le type lâché
// (voir ennemis.js), à défaut celui du vol. Chaque vol a sa faune : on ne
// croise pas les mêmes appareils au-dessus de Dakar et au-dessus de Kingston.
// Le boss n'entre qu'une fois la dernière vague passée et le ciel vide.
//
// boss : pv se compte en tirs encaissés — et il en faut beaucoup, parce qu'un
// joueur à trois canons crache une vingtaine de tirs par seconde. Compter en
// secondes de combat visées, pas en "ça a l'air de faire beaucoup". tir désigne sa salve et trajectoire
// sa manière de tenir l'air (voir SALVES et TRAJECTOIRES dans Vol.js) —
// c'est là qu'est sa particularité, autant que dans sa carrure. altitude est
// la hauteur autour de laquelle il évolue. escorte, si présente, lui envoie
// du renfort pendant le combat.
export const NIVEAUX = [
  {
    id: 'sk001',
    nom: 'VOL SK-001',
    trajet: 'TABOULE VERS LE HAUT',
    histoire: [
      'LA SKAPITAINES COMPANY EST APPELLEE ',
      'POUR UNE MISSION IMPORTANTE.',
      '',
      'UNE ASSIETTE DE TABOULE N EST PAS VERS LE HAUT',
      'VOUS DEVEZ INTERVENIR.',
      '',
      'IL FAUT RETROUVER LE COUPABLE',
      'ET DETRUIRE SON VAISSEAU.',
    ],
    ennemi: 'chasseur',
    vagues: [
      { delai: 2500, motif: 'ligne', nombre: 4, vitesse: 55 },
      { delai: 4000, motif: 'v', nombre: 5, vitesse: 60 },
      { delai: 4500, motif: 'echelle', nombre: 5, vitesse: 65, derive: 18 },
      { delai: 4500, motif: 'ligne', nombre: 6, vitesse: 60 },
      { delai: 5000, motif: 'v', nombre: 6, vitesse: 65, ennemi: 'guepe', derive: 50 },
    ],
    // Large et lent : il arrose devant lui sans viser. On le déborde par le côté.
    boss: {
      id: 'charter',
      nom: 'SIMON BARON',
      pv: 90,
      cadence: 1100,
      vitesse: 45,
      altitude: 56,
      tir: 'eventail',
      trajectoire: 'tangage',
    },
  },
  {
    id: 'sk002',
    nom: 'VOL SK-002',
    trajet: 'LE REVEIL DE JEJE',
    histoire: [
      'ON A RECU UN SOS DES FLOTS BLEUS.',
      'JEJE EST INTROUVABLE.',
      '',
      'IL AURAIT EMBARQUE EN DIRECTION DU SHOGUN',
      'MAIS IL N EST PLUS LE BIENVENU LA BAS.',
      '',
      'IL FAUT L INTERCEPTER.',
      'VITE.',
    ],
    ennemi: 'guepe',
    vagues: [
      { delai: 2500, motif: 'v', nombre: 5, vitesse: 60, derive: 40 },
      { delai: 3800, motif: 'colonne', nombre: 4, vitesse: 70, ennemi: 'plongeur' },
      { delai: 4000, motif: 'echelle', nombre: 6, vitesse: 60, derive: 55 },
      { delai: 4200, motif: 'ligne', nombre: 5, vitesse: 65, ennemi: 'plongeur' },
      { delai: 4200, motif: 'v', nombre: 7, vitesse: 65, derive: 60 },
      { delai: 4500, motif: 'echelle', nombre: 5, vitesse: 70, ennemi: 'plongeur' },
    ],
    // Rapide et précis : il vise le joueur au lieu d'arroser. Rester immobile
    // sous lui ne pardonne pas, il faut bouger en continu.
    boss: {
      id: 'supersonique',
      nom: 'LE VAISSEAU TENTE DE JEJE',
      pv: 120,
      cadence: 800,
      vitesse: 120,
      altitude: 96,
      tir: 'rafale',
      trajectoire: 'pique',
    },
  },
  {
    id: 'sk003',
    nom: 'VOL SK-003',
    trajet: ['LA VENGEANCE EST UN PLAT',
    'QUI SE MANGE FROID'],
    histoire: [
      'DERNIERE ETAPE. DERNIERE MISSION',
      'LE GRAND RECITAL.',
      '',
      'EN FACE : LE TRUBLION ET AMUSEUR PUBLIC',
      'ENNEMI JURE DE LA SKAPITAINE COMPANY.',
      '',
      'PAS DE PLAN DE VOL, PAS DE FILET.',
      'IL FAUT LE DETRUIRE.',
    ],
    ennemi: 'plongeur',
    vagues: [
      { delai: 2200, motif: 'ligne', nombre: 5, vitesse: 60, ennemi: 'chasseur' },
      { delai: 3500, motif: 'colonne', nombre: 3, vitesse: 40, ennemi: 'cargo' },
      { delai: 3600, motif: 'v', nombre: 7, vitesse: 65, ennemi: 'guepe', derive: 60 },
      { delai: 3600, motif: 'echelle', nombre: 6, vitesse: 65 },
      { delai: 3800, motif: 'ligne', nombre: 3, vitesse: 40, ennemi: 'cargo' },
      { delai: 4000, motif: 'echelle', nombre: 7, vitesse: 70, ennemi: 'guepe', derive: 70 },
      { delai: 4200, motif: 'v', nombre: 6, vitesse: 70 },
    ],
    // Il sature le ciel et appelle du renfort : le seul boss qu'on ne combat
    // jamais seul à seul.
    boss: {
      id: 'amiral',
      nom: 'PHILIPPE MAINDRON',
      pv: 160,
      cadence: 750,
      vitesse: 55,
      altitude: 72,
      tir: 'barrage',
      trajectoire: 'pression',
      escorte: { ennemi: 'guepe', nombre: 2, delai: 7000 },
    },
  },
];

// Un trajet trop long tient sur plusieurs lignes : on l'écrit alors en tableau
// dans les données. Les scènes reçoivent toujours un tableau et le disposent
// comme elles veulent — jamais de concaténation directe, qui recollerait les
// lignes avec une virgule.
export function lignesTrajet(n) {
  return Array.isArray(n.trajet) ? n.trajet : [n.trajet];
}

export function niveau(index) {
  return NIVEAUX[index] ?? NIVEAUX[0];
}

export function estDernier(index) {
  return index >= NIVEAUX.length - 1;
}

// Le pochoir du boss est peint par Preload.js sous cette clé.
export function bossTexture(n) {
  return `boss_${n.boss.id}`;
}

// Marge sur les bords : un ennemi qui naît dans l'angle est ingagnable.
const MARGE = 28;

function etale(nombre, i) {
  if (nombre === 1) return LARGEUR / 2;
  return MARGE + ((LARGEUR - 2 * MARGE) * i) / (nombre - 1);
}

// Une formation dit où naissent les appareils d'une vague. Tous entrent par le
// haut, hors cadre : les y sont négatifs, l'écart fait la silhouette du groupe.
const FORMATIONS = {
  ligne: (nombre, i) => ({ x: etale(nombre, i), y: -16 }),
  // Pointe en avant : les ailiers restent en retrait du meneur.
  v: (nombre, i) => ({ x: etale(nombre, i), y: -16 - Math.abs(i - (nombre - 1) / 2) * 14 }),
  colonne: (nombre, i) => ({ x: LARGEUR / 2, y: -16 - i * 24 }),
  echelle: (nombre, i) => ({ x: etale(nombre, i), y: -16 - i * 13 }),
};

export function positionsVague(vague) {
  const forme = FORMATIONS[vague.motif] ?? FORMATIONS.ligne;
  return Array.from({ length: vague.nombre }, (rien, i) => forme(vague.nombre, i));
}
