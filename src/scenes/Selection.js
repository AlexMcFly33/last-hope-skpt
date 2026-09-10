import Phaser from 'phaser';
import { LARGEUR, HAUTEUR, COULEURS, STYLE, TEXTE } from '../constantes.js';
import { PILOTES, STATS, portrait } from '../pilotes.js';
import { APPAREILS, livree } from '../appareils.js';
import { composer } from '../equipage.js';
import { creerCiel } from '../ciel.js';
import { caler } from '../cadrage.js';
import { creerBoutonSourdine } from '../sourdine.js';
import { jouerMusique } from '../musique.js';

const JAUGE_MAX = 5;
const LARGEUR_SEGMENT = 8;

// Portraits importés et pochoirs peints n'ont pas la même taille : caler()
// les ramène tous à cette case (voir cadrage.js).
const COTE_VIGNETTE = 48;

const Y_SPRITE = 70;
const Y_NOM = 108;
const Y_SOUS_TITRE = 120;
const Y_STATS = 144;

// Deux étapes : on choisit d'abord qui pilote, ensuite ce qu'il pilote. Les
// deux écrans partagent la même charpente, seule la source des données change.
const ETAPES = [
  { titre: '1/2  PILOTE', invite: 'ESPACE POUR CONFIRMER' },
  { titre: '2/2  APPAREIL', invite: 'ESPACE POUR EMBARQUER' },
];

export default class Selection extends Phaser.Scene {
  constructor() {
    super('Selection');
  }

  create() {
    this.ciel = creerCiel(this);
    // Revenir ici après un vol doit ramener le morceau d'intro.
    jouerMusique(this, 'intro');
    this.etape = 0;
    this.choixPilote = 0;
    this.choixAppareil = 0;

    this.titre = this.add.text(LARGEUR / 2, 20, '', { ...STYLE, color: TEXTE.accent }).setOrigin(0.5);

    this.vignette = this.add.image(LARGEUR / 2, Y_SPRITE, portrait(PILOTES[0]));
    caler(this.vignette, COTE_VIGNETTE);
    this.nom = this.add.text(LARGEUR / 2, Y_NOM, '', STYLE).setOrigin(0.5);
    this.sousTitre = this.add
      .text(LARGEUR / 2, Y_SOUS_TITRE, '', { ...STYLE, color: TEXTE.terne })
      .setOrigin(0.5);

    this.jauges = this.add.graphics();
    STATS.forEach((stat, i) =>
      this.add.text(48, Y_STATS + i * 14, stat.libelle, { ...STYLE, color: TEXTE.terne })
    );

    this.add
      .text(LARGEUR / 2, HAUTEUR - 40, 'GAUCHE / DROITE POUR CHOISIR', {
        ...STYLE,
        color: TEXTE.terne,
      })
      .setOrigin(0.5);
    this.invite = this.add.text(LARGEUR / 2, HAUTEUR - 28, '', STYLE).setOrigin(0.5);
    this.retour = this.add
      .text(LARGEUR / 2, HAUTEUR - 16, '', { ...STYLE, color: TEXTE.terne })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-LEFT', () => this.deplacer(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.deplacer(1));
    this.input.keyboard.on('keydown-SPACE', () => this.valider());
    this.input.keyboard.on('keydown-ENTER', () => this.valider());
    this.input.keyboard.on('keydown-ESC', () => this.reculer());
    this.input.keyboard.on('keydown-BACKSPACE', () => this.reculer());
    this.input.on('pointerdown', (souris) => this.deplacer(souris.x > LARGEUR / 2 ? 1 : -1));

    // Coin haut droit, à l'écart de tout ce que la scène dessine.
    creerBoutonSourdine(this, LARGEUR - 14, 14);


    this.afficher();
  }

  update(temps, delta) {
    this.ciel.defiler(delta);
  }

  deplacer(sens) {
    if (this.etape === 0) {
      this.choixPilote = Phaser.Math.Wrap(this.choixPilote + sens, 0, PILOTES.length);
    } else {
      this.choixAppareil = Phaser.Math.Wrap(this.choixAppareil + sens, 0, APPAREILS.length);
    }
    this.afficher();
  }

  valider() {
    if (this.etape === 0) {
      this.etape = 1;
      this.afficher();
      return;
    }
    // Consignes d'abord, briefing ensuite : le tuto ne s'affiche qu'ici, avant
    // la première mission. Les vols suivants enchaînent de briefing à briefing.
    this.scene.start('Tuto', {
      piloteId: PILOTES[this.choixPilote].id,
      appareilId: APPAREILS[this.choixAppareil].id,
      niveau: 0,
    });
  }

  reculer() {
    if (this.etape === 0) return;
    this.etape = 0;
    this.afficher();
  }

  afficher() {
    const p = PILOTES[this.choixPilote];
    const a = APPAREILS[this.choixAppareil];
    const equipage = composer(p.id, a.id);
    const surLePilote = this.etape === 0;

    this.titre.setText(ETAPES[this.etape].titre);
    this.invite.setText(ETAPES[this.etape].invite);
    this.retour.setText(surLePilote ? '' : `ECHAP : ${p.nom}`);

    this.vignette.setTexture(surLePilote ? portrait(p) : livree(a, p));
    caler(this.vignette, COTE_VIGNETTE);
    this.nom.setText(surLePilote ? p.nom : a.nom);
    this.sousTitre.setText(surLePilote ? p.instrument : a.devise);

    // À l'étape 1 le pilote est seul en jeu : ses stats de base sont aussi les
    // stats finales, donc ni gain ni perte à montrer.
    this.dessinerJauges(p.stats, surLePilote ? p.stats : equipage.stats, p.couleur);
  }

  // Une jauge raconte d'où vient chaque cran : acquis du pilote, gagné grâce à
  // l'appareil, ou perdu en montant dedans.
  dessinerJauges(base, finale, couleur) {
    this.jauges.clear();

    STATS.forEach((stat, i) => {
      const y = Y_STATS + i * 14;
      const acquis = Math.min(base[stat.cle], finale[stat.cle]);

      for (let n = 0; n < JAUGE_MAX; n += 1) {
        let teinte = COULEURS.jauge;
        if (n < acquis) teinte = couleur;
        else if (n < finale[stat.cle]) teinte = COULEURS.gain;
        else if (n < base[stat.cle]) teinte = COULEURS.perte;

        this.jauges.fillStyle(teinte, 1);
        this.jauges.fillRect(140 + n * (LARGEUR_SEGMENT + 2), y, LARGEUR_SEGMENT, 6);
      }
    });
  }
}
