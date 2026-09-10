import Phaser from 'phaser';
import { LARGEUR, HAUTEUR, STYLE, STYLE_TITRE, TEXTE } from '../constantes.js';
import { creerCiel } from '../ciel.js';
import { niveau } from '../niveaux.js';

const Y_PREMIERE_LIGNE = 118;
const INTERLIGNE = 13;
const CADENCE_LIGNE = 550;

// On entre dans le briefing sur la touche qui a validé l'écran précédent, et
// c'est la même qu'ici : sans ce délai de garde, la répétition du clavier
// traverserait l'escale d'un trait.
const DELAI_DE_GARDE = 350;

// L'histoire, racontée avant le décollage. La scène ne connaît pas le texte :
// elle déroule ce que le niveau lui donne, puis passe la main à Vol avec les
// bagages reçus de l'écran précédent (équipage, score, vies, armement).
export default class Briefing extends Phaser.Scene {
  constructor() {
    super('Briefing');
  }

  init(donnees) {
    this.bagages = donnees ?? {};
    this.niveau = niveau(this.bagages.niveau ?? 0);
  }

  create() {
    this.ciel = creerCiel(this);

    this.add.text(LARGEUR / 2, 56, this.niveau.nom, STYLE_TITRE).setOrigin(0.5);
    this.add
      .text(LARGEUR / 2, 78, this.niveau.trajet, { ...STYLE, color: TEXTE.accent })
      .setOrigin(0.5);

    // Une ligne vide sert de respiration : on la garde dans le compte pour que
    // l'espacement reste celui écrit dans niveaux.js.
    this.lignes = this.niveau.histoire.map((texte, i) =>
      this.add
        .text(LARGEUR / 2, Y_PREMIERE_LIGNE + i * INTERLIGNE, texte, STYLE)
        .setOrigin(0.5)
        .setAlpha(0)
    );
    this.revelees = 0;
    this.ouvertA = this.time.now;

    this.invite = this.add
      .text(LARGEUR / 2, HAUTEUR - 28, '', STYLE)
      .setOrigin(0.5)
      .setAlpha(0);

    this.chrono = this.time.addEvent({
      delay: CADENCE_LIGNE,
      loop: true,
      callback: this.reveler,
      callbackScope: this,
    });

    this.input.keyboard.on('keydown-SPACE', () => this.passer());
    this.input.keyboard.on('keydown-ENTER', () => this.passer());
    this.input.on('pointerdown', () => this.passer());
  }

  update(temps, delta) {
    this.ciel.defiler(delta);
  }

  reveler() {
    if (this.revelees >= this.lignes.length) {
      this.chrono.remove();
      this.terminer();
      return;
    }

    this.tweens.add({ targets: this.lignes[this.revelees], alpha: 1, duration: 300 });
    this.revelees += 1;
  }

  // Le texte affiché, l'invite apparaît : tant qu'elle est là, ESPACE décolle.
  terminer() {
    this.invite.setText('ESPACE : DECOLLER').setAlpha(1);

    // Un seul tween sur alpha, comme au menu : en superposer deux sur la même
    // propriété les fait se disputer la valeur à chaque frame.
    this.tweens.add({
      targets: this.invite,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  // Premier appui : tout le texte d'un coup, pour qui a déjà lu. Second appui :
  // on décolle.
  passer() {
    if (this.time.now - this.ouvertA < DELAI_DE_GARDE) return;

    if (this.revelees < this.lignes.length) {
      this.chrono.remove();
      this.lignes.forEach((ligne) => ligne.setAlpha(1));
      this.revelees = this.lignes.length;
      this.terminer();
      return;
    }

    this.scene.start('Vol', this.bagages);
  }
}
