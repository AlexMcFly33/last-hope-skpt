import Phaser from 'phaser';
import { LARGEUR, HAUTEUR, COULEURS, STYLE, TEXTE, LOGO_IMPORTE } from '../constantes.js';
import { PILOTES, portrait } from '../pilotes.js';
import { APPAREILS, livree } from '../appareils.js';
import { NIVEAUX, bossTexture } from '../niveaux.js';
import { ENNEMIS, ennemiTexture } from '../ennemis.js';
import { BONUS, bonusTexture } from '../bonus.js';
import { fabriquerSons } from '../sons.js';

// Les sprites sont peints en code en attendant de vrais PNG. Les clés générées
// ici (portrait_<pilote>, avion_<appareil>_<pilote>, ennemi_<type>, boss_<boss>,
// bonus_<bonus>, logo, tir_joueur, tir_ennemi, etoile) sont le contrat avec le
// reste du jeu : le jour où les assets arrivent, seul ce fichier change. Les
// bruitages suivent le même principe, voir sons.js.

// Une silhouette par appareil. C = livrée du pilote, O = son ombre,
// H = hublot. Le croisement des deux listes donne toutes les livrées.
const SILHOUETTES = {
  jumbo: [
    '.......CC.......',
    '.......CC.......',
    '......CCCC......',
    '......CHHC......',
    '......CHHC......',
    '.....CCCCCC.....',
    '.....CCCCCC.....',
    '...CCCCCCCCCC...',
    'CCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCC',
    'OOO.CCCCCCCC.OOO',
    '....CCCCCCCC....',
    '.....CCCCCC.....',
    '..CCC.CCCC.CCC..',
    '..CCC.CCCC.CCC..',
    '...O...OO...O...',
  ],
  // Fuselage étroit, ailes courtes : tout est ramassé sur l'axe.
  courrier: [
    '.......CC.......',
    '.......CC.......',
    '.......CC.......',
    '......CHHC......',
    '......CHHC......',
    '......CCCC......',
    '......CCCC......',
    '.....CCCCCC.....',
    '..CCCCCCCCCCCC..',
    '..CCCCCCCCCCCC..',
    '..O..CCCCCC..O..',
    '.....CCCCCC.....',
    '......CCCC......',
    '.....C.CC.C.....',
    '.....C.CC.C.....',
    '.......OO.......',
  ],
  // Large, quatre moteurs, un pont supérieur : il occupe le cadre.
  porteur: [
    '......CCCC......',
    '......CHHC......',
    '.....CCCCCC.....',
    '.....CHHHHC.....',
    '.....CCCCCC.....',
    '....CCCCCCCC....',
    '....CCCCCCCC....',
    'CCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCC',
    'OO.OO.CCCC.OO.OO',
    'OO.OO.CCCC.OO.OO',
    '....CCCCCCCC....',
    '..CCCCC..CCCCC..',
    '..CCCCC..CCCCC..',
    '...OOO....OOO...',
  ],
  // Canons portés en avant, mais soudés aux ailes en flèche.
  intercepteur: [
    '.......CC.......',
    '.......CC.......',
    '..C....CC....C..',
    '..C...CHHC...C..',
    '..CC..CHHC..CC..',
    '..CCC.CCCC.CCC..',
    '..CCCCCCCCCCCC..',
    '.CCCCCCCCCCCCCC.',
    'CCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCC',
    'OO.CCCCCCCCCC.OO',
    '....CCCCCCCC....',
    '....CCCCCCCC....',
    '...CC.CCCC.CC...',
    '..CCC.CCCC.CCC..',
    '...O...OO...O...',
  ],
};

// Un portrait par pilote. C = sa couleur (couvre-chef et épaules), O = son
// ombre (visière), P = son teint, K = les traits, W = le col.
const PORTRAITS = {
  alex: [
    '................',
    '....CCCCCCCC....',
    '...CCCCCCCCCC...',
    '...CCCCCCCCCC...',
    '..OOOOOOOOOOOO..',
    '....PPPPPPPP....',
    '....PPPPPPPP....',
    '....PKPPPPKP....',
    '....PPPPPPPP....',
    '....PPPPPPPP....',
    '....PKKKKKKP....',
    '.....PPPPPP.....',
    '.....PPPPPP.....',
    '....WWWWWWWW....',
    '...CCCCCCCCCC...',
    '..CCCCCCCCCCCC..',
  ],
  rafu: [
    '................',
    '...CCCCCCCCCC...',
    '..CCCCCCCCCCCC..',
    '..CCCCCCCCCCCC..',
    '..OOOOOOOOOOOO..',
    '...PPPPPPPPPP...',
    '...PKPPPPPPKP...',
    '...PPPPPPPPPP...',
    '...PPPPPPPPPP...',
    '...PKKKKKKKKP...',
    '...PKKKKKKKKP...',
    '....PKKKKKKP....',
    '.....KKKKKK.....',
    '...WWWWWWWWWW...',
    '..CCCCCCCCCCCC..',
    '.CCCCCCCCCCCCCC.',
  ],
  gabi: [
    '................',
    '.....CCCCCC.....',
    '....CCCCCCCC....',
    '...OOOOOOOOOO...',
    '...KPPPPPPPPK...',
    '...KPPPPPPPPK...',
    '...KPKPPPPKPK...',
    '...KPPPPPPPPK...',
    '...KPPPPPPPPK...',
    '...KPPKKKKPPK...',
    '...KKPPPPPPKK...',
    '...KK.PPPP.KK...',
    '...KK.PPPP.KK...',
    '....WWWWWWWW....',
    '...CCCCCCCCCC...',
    '..CCCCCCCCCCCC..',
  ],
  wilou: [
    '................',
    '....CCCCCCCC....',
    '...CCCCCCCCCC...',
    '...CCCCCCCCCC...',
    '...OOOOOOOOOO...',
    '....PPPPPPPP....',
    '....PPPPPPPP....',
    '....PKPPPPKP....',
    '....PPPPPPPP....',
    '....PPPPPPPP....',
    '.....PKKKKP.....',
    '.....PPPPPP.....',
    '.....PPPPPP.....',
    '....WWWKKWWW....',
    '...CCCCKKCCCC...',
    '..CCCCCKKCCCCC..',
  ],
};

// Un pochoir par type rival, tous nez vers le bas : ils volent vers nous.
const ENNEMIS_MOTIFS = {
  // Même carlingue que le bimoteur du joueur, retournée.
  chasseur: [
    '...O...OO...O...',
    '..CCC.CCCC.CCC..',
    '..CCC.CCCC.CCC..',
    '.....CCCCCC.....',
    '....CCCCCCCC....',
    'OOO.CCCCCCCC.OOO',
    'CCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCC',
    '...CCCCCCCCCC...',
    '.....CCCCCC.....',
    '.....CCCCCC.....',
    '......CHHC......',
    '......CHHC......',
    '......CCCC......',
    '.......CC.......',
    '.......CC.......',
  ],
  // Ailes en flèche inversée, fuselage mince : tout pour la voltige.
  guepe: [
    '................',
    '...O........O...',
    '...OO......OO...',
    '....CC....CC....',
    '....CCC..CCC....',
    '.....CCCCCC.....',
    '.....CCCCCC.....',
    '..CCCCCCCCCCCC..',
    '..CCCCCCCCCCCC..',
    '.....CCCCCC.....',
    '......CCCC......',
    '......CHHC......',
    '......CHHC......',
    '.......CC.......',
    '.......CC.......',
    '................',
  ],
  // Une fléchette : rien ne dépasse, tout est fait pour tomber vite.
  plongeur: [
    '................',
    '.......CC.......',
    '.......CC.......',
    '......CCCC......',
    '..O...CCCC...O..',
    '..OO..CCCC..OO..',
    '..CCCCCCCCCCCC..',
    '..CCCCCCCCCCCC..',
    '...CCCCCCCCCC...',
    '.....CCCCCC.....',
    '.....CHHHHC.....',
    '......CHHC......',
    '......CCCC......',
    '.......CC.......',
    '.......CC.......',
    '................',
  ],
  // Une barge : large, lente, pleine de hublots.
  cargo: [
    '..O..........O..',
    '..OO........OO..',
    'CCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCC',
    '..OO..CCCC..OO..',
    '..OO..CCCC..OO..',
    '...CCCCCCCCCC...',
    '...CCCCCCCCCC...',
    '...CCCCCCCCCC...',
    '....CCCCCCCC....',
    '....CHHHHHHC....',
    '....CHHHHHHC....',
    '.....CCCCCC.....',
    '......CCCC......',
    '.......CC.......',
    '................',
  ],
};

const TIR_JOUEUR = ['.T.', 'TTT', 'TTT', 'TTT', '.T.'];

const TIR_ENNEMI = ['.T.', 'TTT', '.T.'];

// Un boss par vol. Deux fois plus large qu'un ennemi ordinaire : sa carrure se
// voit avant sa jauge de coque. Même palette que les silhouettes (C, O, H),
// mais aux couleurs de la concurrence.
const BOSS = {
  // Trapu, ailes basses, deux ponts de hublots : un charter bourré de monde.
  charter: [
    '............OOOOOOOO............',
    '............OCCCCCCO............',
    '.............CCCCCC.............',
    '.............CCCCCC.............',
    '...........CCCCCCCCCC...........',
    '...........CCCCCCCCCC...........',
    'OOOO.......CCCCCCCCCC.......OOOO',
    'OOOO.......CCCCCCCCCC.......OOOO',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    '....CCCCCCCCCCCCCCCCCCCCCCCC....',
    '.........CCCCCCCCCCCCCC.........',
    '.........CCHHCCCCCCHHCC.........',
    '.........CCHHCCCCCCHHCC.........',
    '..........CCCCCCCCCCCC..........',
    '...........CCCCCCCCCC...........',
    '............CCCCCCCC............',
    '.............CCCCCC.............',
    '..............CCCC..............',
  ],
  // Nez en aiguille et aile delta : tout est fait pour aller vite.
  supersonique: [
    '..............OOOO..............',
    '..............OCCO..............',
    '..............CCCC..............',
    '..............CCCC..............',
    '.............CCCCCC.............',
    '.............CCCCCC.............',
    'OO...........CCCCCC...........OO',
    'OOO.........CCCCCCCC.........OOO',
    'CCCC........CCCCCCCC........CCCC',
    'CCCCC......CCCCCCCCCC......CCCCC',
    'CCCCCCC...CCCCCCCCCCCC...CCCCCCC',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    '.CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.',
    '...CCCCCCCCCCCCCCCCCCCCCCCCCC...',
    '.......CCCCCCCCCCCCCCCCCC.......',
    '..........CCCCCCCCCCCC..........',
    '...........CCHHHHHHCC...........',
    '...........CCHHHHHHCC...........',
    '............CCCCCCCC............',
    '.............CCCCCC.............',
    '..............CCCC..............',
    '...............CC...............',
  ],
  // Quatre moteurs et un pont supérieur : le vaisseau amiral de la rivale.
  amiral: [
    '............OOOOOOOO............',
    '...........OCCCCCCCCO...........',
    '...........CCCCCCCCCC...........',
    '..........CCCCCCCCCCCC..........',
    '..........CCHHHHHHHHCC..........',
    '..........CCCCCCCCCCCC..........',
    '.........CCCCCCCCCCCCCC.........',
    'OOOO.....CCCCCCCCCCCCCC.....OOOO',
    'OOOO.....CCCCCCCCCCCCCC.....OOOO',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'OO.OO....CCCCCCCCCCCCCC....OO.OO',
    'OO.OO....CCCCCCCCCCCCCC....OO.OO',
    '.........CCCCCCCCCCCCCC.........',
    '........CCCCCCCCCCCCCCCC........',
    '........CCHHCCCCCCCCHHCC........',
    '........CCHHCCCCCCCCHHCC........',
    '.........CCCCCCCCCCCCCC.........',
    '...........CCCCCCCCCC...........',
    '.............CCCCCC.............',
    '..............CCCC..............',
  ],
};

// Les bonus se lisent à la forme avant la couleur : une croix soigne, une
// flèche arme, un flocon givre les ailes, une croix de Saint-André met un
// canon hors service.
const BONUS_MOTIFS = {
  vie: [
    '...BBB...',
    '...BBB...',
    '...BBB...',
    'BBBBBBBBB',
    'BBBBBBBBB',
    'BBBBBBBBB',
    '...BBB...',
    '...BBB...',
    '...BBB...',
  ],
  arme: [
    '....B....',
    '...BBB...',
    '..BBBBB..',
    '.BBBBBBB.',
    'BBBBBBBBB',
    '...BBB...',
    '...BBB...',
    '...BBB...',
    '...BBB...',
  ],
  givre: [
    '....B....',
    'B..BBB..B',
    '.B.BBB.B.',
    '..BBBBB..',
    'BBBBBBBBB',
    '..BBBBB..',
    '.B.BBB.B.',
    'B..BBB..B',
    '....B....',
  ],
  panne: [
    'BB.....BB',
    'BBB...BBB',
    '.BBB.BBB.',
    '..BBBBB..',
    '...BBB...',
    '..BBBBB..',
    '.BBB.BBB.',
    'BBB...BBB',
    'BB.....BB',
  ],
};

// Emblème de la compagnie, en attendant le vrai logo du groupe : une cocarde
// ailée. Remplacé par public/logo.png dès que LOGO_IMPORTE passe à true.
const LOGO = [
  '..............CCCC..............',
  '.............CCCCCC.............',
  '............CCCHHCCC............',
  '...........CCCHHHHCCC...........',
  'OOOOOOOOOOOCCHHHHHHCCOOOOOOOOOOO',
  '.OOOOOOOOOOCCHHHHHHCCOOOOOOOOOO.',
  '...OOOOOOOOCCCHHHHCCCOOOOOOOO...',
  '......OOOOOCCCCCCCCCCOOOOO......',
  '............CCCCCCCC............',
  '.............CCCCCC.............',
  '..............CCCC..............',
];

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this.embarquement();
    this.load.audio('musique', 'audio/musique.wav');

    // Un pilote marqué photo: true attend son PNG dans public/portraits/.
    // On ne demande que ceux-là : réclamer les autres ferait des 404 inutiles.
    PILOTES.filter((p) => p.photo).forEach((p) =>
      this.load.image(portrait(p), `portraits/${p.id}.png`)
    );

    if (LOGO_IMPORTE) this.load.image('logo', 'logo.png');
  }

  // La musique pèse plus lourd que tout le reste réuni : sans jauge, le jeu
  // resterait sur un écran noir le temps de son téléchargement.
  embarquement() {
    this.add
      .text(LARGEUR / 2, HAUTEUR / 2 - 14, 'EMBARQUEMENT', { ...STYLE, color: TEXTE.accent })
      .setOrigin(0.5);

    const barre = this.add.graphics();
    this.load.on('progress', (avancement) => {
      barre.clear();
      barre.fillStyle(COULEURS.jauge, 1);
      barre.fillRect(64, HAUTEUR / 2, 128, 6);
      barre.fillStyle(COULEURS.hublot, 1);
      barre.fillRect(64, HAUTEUR / 2, 128 * avancement, 6);
    });
  }

  // Un identifiant de pilotes.js ou appareils.js sans motif ici plantait sur
  // un « undefined.forEach » illisible. On nomme le coupable. Un pilote dont la
  // photo est bien arrivée n'a pas besoin de son pochoir.
  verifierPochoirs() {
    const manques = [
      ...PILOTES.filter((p) => !this.textures.exists(portrait(p)) && !PORTRAITS[p.id]).map(
        (p) => `PORTRAITS.${p.id}`
      ),
      ...APPAREILS.filter((a) => !SILHOUETTES[a.id]).map((a) => `SILHOUETTES.${a.id}`),
      ...NIVEAUX.filter((n) => !BOSS[n.boss.id]).map((n) => `BOSS.${n.boss.id}`),
      ...ENNEMIS.filter((e) => !ENNEMIS_MOTIFS[e.id]).map((e) => `ENNEMIS_MOTIFS.${e.id}`),
      ...BONUS.filter((b) => !BONUS_MOTIFS[b.id]).map((b) => `BONUS_MOTIFS.${b.id}`),
    ];

    if (manques.length > 0) {
      throw new Error(
        `Preload.js : pochoir absent pour ${manques.join(', ')}. Un identifiant a été ` +
          `renommé dans les données sans que son motif suive ici.`
      );
    }
  }

  create() {
    this.verifierPochoirs();

    PILOTES.forEach((p) => {
      // Une photo déjà chargée occupe la clé : le pochoir ne sert que de
      // doublure pour les pilotes qui n'en ont pas encore.
      if (!this.textures.exists(portrait(p))) {
        this.peindre(portrait(p), PORTRAITS[p.id], {
          C: p.couleur,
          O: p.ombre,
          P: p.peau,
          K: COULEURS.trait,
          W: COULEURS.col,
        });
      }

      // Toutes les livrées d'avance : seize pochoirs de 16x16, le coût est nul
      // et le vol n'a plus rien à générer.
      APPAREILS.forEach((a) => {
        this.peindre(livree(a, p), SILHOUETTES[a.id], {
          C: p.couleur,
          O: p.ombre,
          H: COULEURS.hublot,
        });
      });
    });

    // Chaque rival porte sa propre livrée, comme les pilotes portent la leur.
    ENNEMIS.forEach((e) =>
      this.peindre(ennemiTexture(e.id), ENNEMIS_MOTIFS[e.id], {
        C: e.couleur,
        O: e.ombre,
        H: COULEURS.hublot,
      })
    );
    this.peindre('tir_joueur', TIR_JOUEUR, { T: COULEURS.tirJoueur });
    this.peindre('tir_ennemi', TIR_ENNEMI, { T: COULEURS.tirEnnemi });
    this.peindre('etoile', ['E'], { E: COULEURS.etoile });

    NIVEAUX.forEach((n) => {
      this.peindre(bossTexture(n), BOSS[n.boss.id], {
        C: COULEURS.boss,
        O: COULEURS.bossOmbre,
        H: COULEURS.hublot,
      });
    });

    const TEINTES = {
      vie: COULEURS.bonusVie,
      arme: COULEURS.bonusArme,
      givre: COULEURS.bonusGivre,
      panne: COULEURS.bonusPanne,
    };
    BONUS.forEach((b) =>
      this.peindre(bonusTexture(b.id), BONUS_MOTIFS[b.id], { B: TEINTES[b.id] })
    );

    // Comme pour les portraits : un fichier déjà chargé occupe la clé, le
    // pochoir ne sert que de doublure.
    if (!this.textures.exists('logo')) {
      this.peindre('logo', LOGO, {
        C: COULEURS.gain,
        O: COULEURS.hublot,
        H: COULEURS.ciel,
      });
    }

    // Même principe que les pochoirs : fabriqués une fois ici, déposés dans le
    // cache, joués ensuite comme n'importe quel son chargé depuis un fichier.
    fabriquerSons(this);

    this.scene.start('Menu');
  }

  // Un pochoir : tableau de lignes, un caractère par pixel, palette en regard.
  // Un caractère absent de la palette laisse le pixel transparent.
  peindre(cle, motif, palette) {
    const g = this.make.graphics({ add: false });

    motif.forEach((ligne, y) => {
      [...ligne].forEach((caractere, x) => {
        const couleur = palette[caractere];
        if (couleur === undefined) return;
        g.fillStyle(couleur, 1);
        g.fillRect(x, y, 1, 1);
      });
    });

    g.generateTexture(cle, motif[0].length, motif.length);
    g.destroy();
  }
}
