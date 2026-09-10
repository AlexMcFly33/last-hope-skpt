import Phaser from 'phaser';
import { LARGEUR, HAUTEUR, STYLE, STYLE_TITRE, TEXTE, RECORD } from '../constantes.js';
import { composer } from '../equipage.js';
import { creerCiel } from '../ciel.js';
import { niveau } from '../niveaux.js';
import { lire, ecrire } from '../stockage.js';

const DELAI_DE_GARDE = 500;

export default class Fin extends Phaser.Scene {
  constructor() {
    super('Fin');
  }

  init(donnees) {
    this.degats = donnees?.degats ?? 0;
    this.equipage = composer(donnees?.piloteId, donnees?.appareilId);
    this.indexNiveau = donnees?.niveau ?? 0;
    this.niveau = niveau(this.indexNiveau);
    this.victoire = donnees?.victoire ?? false;
  }

  create() {
    this.ciel = creerCiel(this);
    // ESPACE est la touche de tir : on arrive souvent ici en la tenant. Ce
    // délai laisse le temps de lire l'écran avant qu'elle ne le referme.
    this.ouvertA = this.time.now;

    const record = Number(lire(RECORD, 0));
    const bat = this.degats > record;
    if (bat) ecrire(RECORD, this.degats);

    this.add
      .text(LARGEUR / 2, 96, this.victoire ? 'LIGNE REPRISE' : 'VOL ANNULE', STYLE_TITRE)
      .setOrigin(0.5);
    this.add.image(LARGEUR / 2, 140, this.equipage.texture).setScale(2).setAlpha(0.5);
    this.add
      .text(LARGEUR / 2, 160, `${this.equipage.pilote.nom} / ${this.equipage.appareil.nom}`, {
        ...STYLE,
        color: TEXTE.terne,
      })
      .setOrigin(0.5);
    this.add
      .text(
        LARGEUR / 2,
        172,
        this.victoire ? 'TOUTE LA LIGNE' : `${this.niveau.nom} / ${this.niveau.trajet}`,
        { ...STYLE, color: TEXTE.terne }
      )
      .setOrigin(0.5);
    this.add.text(LARGEUR / 2, 188, `${this.degats} DEGATS`, STYLE).setOrigin(0.5);
    this.add
      .text(LARGEUR / 2, 202, bat ? 'NOUVEAU RECORD' : `RECORD ${Math.max(record, this.degats)}`, {
        ...STYLE,
        color: bat ? TEXTE.accent : TEXTE.terne,
      })
      .setOrigin(0.5);

    this.add
      .text(
        LARGEUR / 2,
        HAUTEUR - 40,
        this.victoire ? 'ESPACE : NOUVELLE MISSION' : 'ESPACE : REFAIRE CE VOL',
        STYLE
      )
      .setOrigin(0.5);
    this.add
      .text(LARGEUR / 2, HAUTEUR - 28, 'ECHAP : SALLE D EMBARQUEMENT', {
        ...STYLE,
        color: TEXTE.terne,
      })
      .setOrigin(0.5);

    // La musique tourne déjà : on ne repasse pas par Menu.decoller().
    this.input.keyboard.once('keydown-SPACE', () => this.reprendre());
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('Selection'));
  }

  update(temps, delta) {
    this.ciel.defiler(delta);
  }

  // Une tentative perdue se rejoue au même vol, compteurs neufs : on repart
  // sans bagages, Vol reprendra ses valeurs par défaut. Le record, lui, est
  // déjà en banque. La ligne bouclée, on renvoie au choix d'équipage.
  reprendre() {
    if (this.time.now - this.ouvertA < DELAI_DE_GARDE) {
      this.input.keyboard.once('keydown-SPACE', () => this.reprendre());
      return;
    }

    if (this.victoire) {
      this.scene.start('Selection');
      return;
    }

    this.scene.start('Briefing', {
      piloteId: this.equipage.pilote.id,
      appareilId: this.equipage.appareil.id,
      niveau: this.indexNiveau,
    });
  }
}
