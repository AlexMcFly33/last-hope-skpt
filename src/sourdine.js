import Phaser from 'phaser';
import { lire, ecrire } from './stockage.js';

// Le choix de couper le son survit au rechargement : l'avoir coupé puis
// recommencé une partie ne doit pas le rallumer dans le dos du joueur.
const CLE = 'skapitaines.sourdine';

// Le clic vise mal sur douze pixels : la zone sensible déborde du dessin.
const MARGE_CLIC = 5;

// L'état vit en mémoire, le stockage ne fait que le retenir d'une visite à
// l'autre. Sans cette copie, un navigateur qui refuse localStorage rendrait le
// bouton inerte : il basculerait le son sans jamais changer d'apparence.
let coupe = null;

export function sourdineActive() {
  if (coupe === null) coupe = lire(CLE) === '1';
  return coupe;
}

function basculer() {
  coupe = !sourdineActive();
  ecrire(CLE, coupe ? '1' : '0');
  return coupe;
}

// À appeler dans toute scène qui démarre, bouton ou pas : sans ça, recharger
// la page rallumerait la musique.
export function appliquerSourdine(scene) {
  scene.sound.mute = sourdineActive();
}

function texture() {
  return sourdineActive() ? 'son_coupe' : 'son_actif';
}

// Un haut-parleur cliquable. Rend l'image, pour qui voudrait la repositionner.
export function creerBoutonSourdine(scene, x, y) {
  appliquerSourdine(scene);

  const bouton = scene.add
    .image(x, y, texture())
    .setDepth(20)
    .setInteractive(
      new Phaser.Geom.Rectangle(
        -MARGE_CLIC,
        -MARGE_CLIC,
        12 + MARGE_CLIC * 2,
        12 + MARGE_CLIC * 2
      ),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: true }
    );

  bouton.on('pointerdown', (pointeur, px, py, evenement) => {
    // Sans ça le clic continue jusqu'au gestionnaire global de la scène, qui
    // l'entend comme « changer de pilote » ou « passer le tuto ».
    evenement.stopPropagation();

    scene.sound.mute = basculer();
    bouton.setTexture(texture());
  });

  return bouton;
}
