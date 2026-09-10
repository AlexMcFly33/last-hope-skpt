// Les morceaux et leur enchaînement. Le gestionnaire de son de Phaser est
// global : la musique ne s'arrête pas à un changement de scène, c'est donc ici
// qu'on retient ce qui tourne, et pas dans une scène.
//
// presente : à false, le fichier n'est pas réclamé au chargement. Même principe
// que LOGO_IMPORTE — on ne demande que ce qui existe vraiment, sinon la jauge
// d'embarquement part en 404.
export const MUSIQUES = {
  intro: {
    cle: 'musique_intro',
    fichier: 'audio/musique.m4a',
    volume: 0.4,
    presente: true,
  },
  vol: {
    cle: 'musique_vol',
    fichier: 'audio/musique-vol.m4a',
    volume: 0.4,
    presente: true,
  },
};

// Assez long pour s'entendre comme un fondu, assez court pour ne pas traîner
// sur les premières secondes de vol.
const DUREE_FONDU = 1400;

let enCours = null;
let nomEnCours = null;

export function chargerMusiques(scene) {
  Object.values(MUSIQUES)
    .filter((m) => m.presente)
    .forEach((m) => scene.load.audio(m.cle, m.fichier));
}

// Passe d'un morceau à l'autre en fondu croisé. Rappeler avec le morceau déjà
// en cours ne fait rien : les scènes peuvent l'appeler à chaque création sans
// avoir à savoir d'où vient le joueur.
export function jouerMusique(scene, nom) {
  if (nomEnCours === nom) return;

  const ancien = enCours;
  enCours = null;
  nomEnCours = nom;

  const morceau = MUSIQUES[nom];
  // Un morceau pas encore livré fait simplement silence : le fondu de sortie du
  // précédent a quand même lieu, ce qui est le comportement attendu.
  const present = morceau && scene.cache.audio.exists(morceau.cle);

  // Un fondu est un tween, donc propriété de la scène qui le lance : si elle se
  // termine dans la foulée, il meurt avec elle et le volume reste figé où il en
  // était. C'est exactement le cas de Menu.decoller(), qui enchaîne aussitôt sur
  // la sélection — la musique jouait alors à volume nul jusqu'au retour au menu.
  // On ne fond donc qu'entre deux morceaux ; le premier démarre à son volume.
  if (present) {
    enCours = scene.sound.add(morceau.cle, {
      loop: true,
      volume: ancien ? 0 : morceau.volume,
    });
    enCours.play();
  }

  if (!ancien) return;

  scene.tweens.add({
    targets: ancien,
    volume: 0,
    duration: DUREE_FONDU,
    onComplete: () => ancien.destroy(),
  });
  if (enCours) {
    scene.tweens.add({ targets: enCours, volume: morceau.volume, duration: DUREE_FONDU });
  }
}

// Le rechargement de la page repart de zéro : sans ça, une scène croirait qu'un
// morceau tourne encore alors que le gestionnaire de son est neuf.
export function oublierMusique() {
  enCours = null;
  nomEnCours = null;
}
