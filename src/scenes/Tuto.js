import Phaser from 'phaser';
import { LARGEUR, HAUTEUR, STYLE, STYLE_TITRE, TEXTE } from '../constantes.js';
import { creerCiel } from '../ciel.js';
import { BONUS, bonusTexture } from '../bonus.js';
import { creerBoutonSourdine } from '../sourdine.js';

const Y_COMMANDES = 58;
const Y_LEGENDE = 122;
const Y_PREMIERE_LIGNE = 142;
const INTERLIGNE = 26;
const X_ICONE = 40;
const X_TEXTE = 58;

// Les commandes, à gauche la touche, à droite ce qu'elle fait.
const COMMANDES = [
  ['FLECHES', 'PILOTER'],
  ['ESPACE', 'TIRER'],
  ['ECHAP', 'REVENIR EN ARRIERE'],
];

// Consigne d'avant-vol : comment on pilote, et surtout comment se lit ce qui
// tombe du ciel. La légende se construit depuis bonus.js — ajouter un bonus
// là-bas le fait apparaître ici sans toucher cette scène.
export default class Tuto extends Phaser.Scene {
  constructor() {
    super('Tuto');
  }

  init(donnees) {
    this.bagages = donnees ?? {};
  }

  create() {
    this.ciel = creerCiel(this);

    this.add.text(LARGEUR / 2, 26, 'CONSIGNES', STYLE_TITRE).setOrigin(0.5);

    COMMANDES.forEach(([touche, effet], i) => {
      const y = Y_COMMANDES + i * 12;
      this.add.text(X_ICONE, y, touche, { ...STYLE, color: TEXTE.accent });
      this.add.text(X_TEXTE + 52, y, effet, { ...STYLE, color: TEXTE.clair });
    });

    this.add
      .text(LARGEUR / 2, 98, 'LE SCORE COMPTE LES DEGATS INFLIGES', {
        ...STYLE,
        color: TEXTE.terne,
      })
      .setOrigin(0.5);

    this.add
      .text(LARGEUR / 2, Y_LEGENDE, 'CE QUI TOMBE DU CIEL', { ...STYLE, color: TEXTE.accent })
      .setOrigin(0.5);

    BONUS.forEach((bonus, i) => {
      const y = Y_PREMIERE_LIGNE + i * INTERLIGNE;

      this.add.image(X_ICONE, y + 4, bonusTexture(bonus.id));
      this.add.text(X_TEXTE, y - 4, bonus.libelle, {
        ...STYLE,
        color: bonus.malus ? TEXTE.alerte : TEXTE.clair,
      });
      this.add.text(X_TEXTE, y + 6, bonus.effet, { ...STYLE, color: TEXTE.terne });
    });

    const invite = this.add
      .text(LARGEUR / 2, HAUTEUR - 26, 'ESPACE : REJOINDRE L APPAREIL', STYLE)
      .setOrigin(0.5);
    this.tweens.add({ targets: invite, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    // Même garde qu'au briefing : on arrive ici sur ESPACE, et la répétition du
    // clavier traverserait l'écran sans qu'on ait rien lu.
    this.ouvertA = this.time.now;
    this.input.keyboard.on('keydown-SPACE', () => this.passer());
    this.input.keyboard.on('keydown-ENTER', () => this.passer());
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Selection'));
    this.input.on('pointerdown', () => this.passer());

    // Coin haut droit, à l'écart de tout ce que la scène dessine.
    creerBoutonSourdine(this, LARGEUR - 14, 14);

  }

  update(temps, delta) {
    this.ciel.defiler(delta);
  }

  passer() {
    if (this.time.now - this.ouvertA < 350) return;
    this.scene.start('Briefing', this.bagages);
  }
}
