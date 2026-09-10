import Phaser from 'phaser';
import { LARGEUR, HAUTEUR, COULEURS } from './constantes.js';
import Preload from './scenes/Preload.js';
import Menu from './scenes/Menu.js';
import Selection from './scenes/Selection.js';
import Tuto from './scenes/Tuto.js';
import Briefing from './scenes/Briefing.js';
import Vol from './scenes/Vol.js';
import Fin from './scenes/Fin.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'jeu',
  width: LARGEUR,
  height: HAUTEUR,
  pixelArt: true,
  backgroundColor: COULEURS.ciel,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [Preload, Menu, Selection, Tuto, Briefing, Vol, Fin],
});
