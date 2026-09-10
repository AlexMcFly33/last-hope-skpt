import Phaser from 'phaser';
import { LARGEUR, HAUTEUR, STYLE, STYLE_TITRE, TEXTE, RECORD } from '../constantes.js';
import { creerCiel } from '../ciel.js';
import { caler } from '../cadrage.js';

// Le logo tient dans une case fixe : qu'il vienne du pochoir 32x11 ou d'un PNG
// maison, il occupe la même place sous le sous-titre.
const COTE_LOGO = 88;
const Y_LOGO = 152;
const Y_INVITE = 246;

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.ciel = creerCiel(this);
    this.decolle = false;

    this.add.text(LARGEUR / 2, 72, 'LES SKAPITAINES', STYLE_TITRE).setOrigin(0.5);
    this.add
      .text(LARGEUR / 2, 92, 'LE DERNIER ESPOIR', { ...STYLE, color: TEXTE.terne })
      .setOrigin(0.5);

    const logo = this.add.image(LARGEUR / 2, Y_LOGO, 'logo');
    caler(logo, COTE_LOGO);

    // À mi-distance entre le bas du logo et le record : collée plus haut, elle
    // se lisait comme faisant partie du bloc titre.
    const invite = this.add
      .text(LARGEUR / 2, Y_INVITE, 'ACCEPTER LA MISSION', STYLE)
      .setOrigin(0.5);

    this.tweens.add({
      targets: invite,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    const record = Number(localStorage.getItem(RECORD) ?? 0);
    if (record > 0) {
      this.add
        .text(LARGEUR / 2, HAUTEUR - 24, `RECORD ${record} DEGATS`, {
          ...STYLE,
          color: TEXTE.terne,
        })
        .setOrigin(0.5);
    }

    this.input.keyboard.once('keydown', () => this.decoller());
    this.input.once('pointerdown', () => this.decoller());
  }

  update(temps, delta) {
    this.ciel.defiler(delta);
  }

  // Seul point d'entrée valide pour l'audio : les navigateurs refusent toute
  // lecture qui ne suit pas un geste utilisateur, et ce clic-là en est un.
  decoller() {
    if (this.decolle) return;
    this.decolle = true;

    if (this.sound.locked) this.sound.unlock();
    if (this.cache.audio.exists('musique') && !this.sound.get('musique')) {
      this.sound.play('musique', { loop: true, volume: 0.4 });
    }

    this.scene.start('Selection');
  }
}
