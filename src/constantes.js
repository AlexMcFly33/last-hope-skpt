// Résolution interne du jeu. Tout le code raisonne dans ce repère ;
// pixelArt + Scale.FIT s'occupent de l'affichage réel.
export const LARGEUR = 256;
export const HAUTEUR = 320;

export const COULEURS = {
  ciel: 0x0b1026,
  hublot: 0x9fe0ff,
  tirJoueur: 0xf7f06d,
  tirEnnemi: 0xff8a3d,
  etoile: 0xffffff,
  // Portraits : la couleur du pilote habille la casquette, celles-ci sont
  // communes à tout l’équipage.
  trait: 0x241a1a,
  col: 0xf4f4f4,
  // Jauges de l’écran de sélection : acquis du pilote, gain et perte dus à l’appareil.
  jauge: 0x2a3050,
  gain: 0xf7d51d,
  perte: 0x9a3b3b,
  // Bonus à ramasser en vol. Chaque type a sa forme autant que sa couleur :
  // en 9x9 pixels, la teinte seule ne suffit pas à les distinguer.
  bonusVie: 0x6fd08c,
  bonusArme: 0xf7d51d,
  // Beige de sac de chantier, et sa teinte d'ombre pour les rabats.
  bonusEnduit: 0xd8c9a3,
  bonusEnduitOmbre: 0xa8946b,
  bonusPanne: 0xc94f7c,
  // Boss de fin de vol et sa jauge de coque.
  boss: 0x8f4fd9,
  bossOmbre: 0x4a2673,
  bossJauge: 0xd94f4f,
};

export const TEXTE = {
  clair: '#f4f4f4',
  terne: '#8a93b2',
  accent: '#f7d51d',
  alerte: '#e0708f',
};

export const STYLE = {
  fontFamily: 'monospace',
  fontSize: '8px',
  color: TEXTE.clair,
};

export const STYLE_TITRE = {
  fontFamily: 'monospace',
  fontSize: '16px',
  color: TEXTE.accent,
};

// Chaque partie décolle avec le même capital, quel que soit l'équipage.
// Un bonus d'équipage peut en rendre, jamais au-delà du plafond.
export const VIES_DEPART = 3;
export const VIES_MAX = 5;

// Un logo maison se dépose dans public/logo.png ; ce drapeau le charge à la
// place de l'emblème peint dans Preload.js. Même principe que photo: true pour
// les portraits : on ne réclame que les fichiers réellement présents, sinon le
// chargement part en 404.
export const LOGO_IMPORTE = true;

export const VITESSE_TIR_JOUEUR = -280;
export const VITESSE_TIR_ENNEMI = 180;

// Le score ne compte que les dégâts infligés : un tir qui porte vaut un point,
// et rien d'autre n'en rapporte. Un appareil coriace vaut donc plus qu'un
// frêle, sans qu'aucune prime n'ait à être accordée quelque part.
export const DEGATS_PAR_TIR = 10;

// Clé distincte de l'ancien record en miles : les deux échelles n'ont rien à
// voir, un report ferait un record intenable.
export const RECORD = 'skapitaines.record.degats';
