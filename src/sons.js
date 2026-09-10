// Les bruitages sont fabriqués en code, comme les sprites : en attendant de
// vrais échantillons, une enveloppe et un oscillateur suffisent, et le jeu ne
// traîne aucun fichier. Les clés produites ici (tir_1..tir_3, explosion,
// explosion_boss, bonus, malus, impact) sont le contrat avec les scènes :
// quand de vrais sons arriveront, seul ce fichier changera.
//
// duree : en secondes. volume : amplitude crête, à garder sous 1 pour ne pas
// saturer. chute : vitesse d'extinction, plus le nombre est bas plus le son
// tient. Attention, le volume seul ne dit pas la puissance perçue : à crête
// égale une dent de scie porte bien moins qu'un carré, d'où le volume du
// troisième cran, plus haut que les autres sans sonner plus fort pour autant.
export const SONS = {
  // Un tir par cran d'armement. Plus on monte, plus le trait est grave, long
  // et plein : la montée en puissance doit s'entendre autant qu'elle se voit.
  tir_1: { voix: 'laser', duree: 0.1, debut: 940, fin: 280, timbre: 'carre', volume: 0.15, chute: 32 },
  tir_2: { voix: 'laser', duree: 0.13, debut: 760, fin: 210, timbre: 'carre', volume: 0.21, chute: 24 },
  tir_3: { voix: 'laser', duree: 0.16, debut: 610, fin: 140, timbre: 'scie', volume: 0.40, chute: 15 },

  // Les explosions doivent passer au-dessus des tirs : on en entend sept par
  // seconde à pleine cadence, un souffle plus discret s'y noierait.
  // bruit et corps dosent le mélange : du souffle, ou de la matière qui cogne.
  // Un appareil qui tombe : bref et sec.
  explosion: { voix: 'souffle', duree: 0.35, grave: 170, douceur: 0.6, bruit: 1.6, corps: 0.5, volume: 0.5 },
  // Un boss n'a pas droit au même petit bruit : plus long, plus grave, plus sourd.
  explosion_boss: { voix: 'souffle', duree: 1.1, grave: 65, douceur: 0.86, bruit: 1.6, corps: 0.5, volume: 0.8 },
  // Se faire toucher, ce n'est pas exploser : presque pas de souffle, surtout
  // du corps. Un coup sourd dans la carlingue, qu'on ne confond pas avec la
  // mort d'un ennemi.
  impact: { voix: 'souffle', duree: 0.28, grave: 90, douceur: 0.72, bruit: 0.55, corps: 1.5, volume: 0.33 },

  // Ce qu'on ramasse s'entend avant même d'être lu : le bonus monte, le malus
  // descend. Trois notes suffisent, l'oreille tranche en un quart de seconde.
  bonus: { voix: 'arpege', duree: 0.26, notes: [523, 784, 1047], timbre: 'triangle', chute: 9, volume: 0.34 },
  malus: { voix: 'arpege', duree: 0.34, notes: [415, 330, 233], timbre: 'carre', chute: 7, volume: 0.21 },
};

// La phase est comptée en tours, pas en radians : une forme d'onde n'a qu'à
// regarder où elle en est dans son cycle.
const TIMBRES = {
  carre: (tours) => ((tours % 1) + 1) % 1 < 0.5 ? 1 : -1,
  scie: (tours) => 2 * (((tours % 1) + 1) % 1) - 1,
  // Plus doux que les deux autres : de quoi faire un carillon plutôt qu'un cri.
  triangle: (tours) => 4 * Math.abs((((tours % 1) + 1) % 1) - 0.5) - 1,
};

const VOIX = {
  // Balayage descendant, la signature du tir de shmup. La phase est intégrée
  // analytiquement plutôt qu'accumulée : pour une rampe linéaire de fréquence
  // c'est exact, et ça évite de traîner un état entre deux échantillons.
  laser: (recette) => {
    const forme = TIMBRES[recette.timbre] ?? TIMBRES.carre;
    const pente = (recette.fin - recette.debut) / (2 * recette.duree);

    return (t) => {
      const tours = recette.debut * t + pente * t * t;
      return forme(tours) * Math.exp(-t * recette.chute) * recette.volume;
    };
  },

  // Du bruit qu'on étouffe, doublé d'un grondement qui s'effondre. Le filtre à
  // un pôle est indispensable : sans lui c'est un grésillement, pas un souffle.
  souffle: (recette) => {
    let precedent = 0;

    return (t, avance) => {
      precedent =
        precedent * recette.douceur + (Math.random() * 2 - 1) * (1 - recette.douceur);
      const grondement = Math.sin(2 * Math.PI * recette.grave * (1 - avance * 0.55) * t);
      const enveloppe = (1 - avance) ** 2.2;

      return (precedent * recette.bruit + grondement * recette.corps) * enveloppe * recette.volume;
    };
  },

  // Quelques notes à la suite, chacune avec sa propre attaque : c'est la
  // direction de la suite qui porte le sens, montante ou descendante.
  arpege: (recette) => {
    const forme = TIMBRES[recette.timbre] ?? TIMBRES.carre;
    const parNote = recette.duree / recette.notes.length;

    return (t) => {
      const rang = Math.min(recette.notes.length - 1, Math.floor(t / parNote));
      const depuis = t - rang * parNote;

      return (
        forme(recette.notes[rang] * depuis) * Math.exp(-depuis * recette.chute) * recette.volume
      );
    };
  },
};

function rendre(contexte, recette) {
  const taux = contexte.sampleRate;
  const total = Math.max(1, Math.floor(taux * recette.duree));
  const tampon = contexte.createBuffer(1, total, taux);
  const canal = tampon.getChannelData(0);
  const voix = VOIX[recette.voix](recette);

  for (let i = 0; i < total; i += 1) {
    // Écrêtage de sécurité : une recette trop généreuse doit saturer proprement
    // plutôt que de cracher.
    canal[i] = Math.max(-1, Math.min(1, voix(i / taux, i / total)));
  }
  return tampon;
}

// Fabrique tous les bruitages et les dépose dans le cache audio, où Phaser les
// lit comme n'importe quel fichier chargé. Sans WebAudio (onglet muet, gestion
// de son désactivée), on repart sans rien : le jeu doit tourner en silence
// plutôt que refuser de démarrer.
export function fabriquerSons(scene) {
  const contexte = scene.sound?.context;
  if (!contexte || typeof contexte.createBuffer !== 'function') return false;

  Object.entries(SONS).forEach(([cle, recette]) => {
    if (!scene.cache.audio.exists(cle)) {
      scene.cache.audio.add(cle, rendre(contexte, recette));
    }
  });
  return true;
}

// Le tir dépend du cran d'armement, borné à ce qui existe réellement.
export function sonDuTir(cranArme) {
  return `tir_${Math.min(cranArme + 1, 3)}`;
}
