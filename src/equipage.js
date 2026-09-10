import { pilote, STATS, vitesseDe, cadenceDe, repitDe } from './pilotes.js';
import { appareil, livree } from './appareils.js';

const MIN = 1;
const MAX = 5;

// Les jauges de l'écran de sélection valent de 1 à 5 : un correctif d'appareil
// ne doit jamais sortir de cette échelle, sinon la barre mentirait sur ce que
// le joueur emporte réellement.
export function borner(valeur) {
  return Math.min(MAX, Math.max(MIN, valeur));
}

// Le seul endroit où un pilote et un appareil se rencontrent. Tout ce dont une
// scène a besoin en vol sort d'ici, elle n'a pas à refaire l'addition.
export function composer(piloteId, appareilId) {
  const p = pilote(piloteId);
  const a = appareil(appareilId);

  const stats = {};
  STATS.forEach(({ cle }) => {
    stats[cle] = borner(p.stats[cle] + a.bonus[cle]);
  });

  return {
    pilote: p,
    appareil: a,
    stats,
    texture: livree(a, p),
    vitesse: vitesseDe(stats),
    cadence: cadenceDe(stats),
    repit: repitDe(stats),
  };
}
