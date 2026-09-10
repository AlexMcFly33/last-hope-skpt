// Deuxième moitié du choix d'embarquement. Un appareil apporte une silhouette
// (son pochoir vit dans Preload.js, comme tous les sprites) et des correctifs
// aux stats du pilote. Ajouter un appareil ici et son pochoir là-bas suffit :
// aucune scène ne connaît la liste.
//
// bonus : ajouté aux stats du pilote puis borné à 1..5 par equipage.js.
export const APPAREILS = [
  {
    id: 'jumbo',
    nom: 'LE JUMBO JET',
    devise: 'INCASSABLE',
    bonus: { vitesse: 0, cadence: 0, blindage: 0 },
  },
  {
    id: 'courrier',
    nom: 'LE COURRIER',
    devise: 'LEGER ET NERVEUX',
    bonus: { vitesse: 2, cadence: 0, blindage: -1 },
  },
  {
    id: 'porteur',
    nom: 'LE GROS PORTEUR',
    devise: 'LENT MAIS SOLIDE',
    bonus: { vitesse: -1, cadence: -1, blindage: 2 },
  },
  {
    id: 'intercepteur',
    nom: 'L INTERCEPTEUR',
    devise: 'CANONS JUMELES',
    bonus: { vitesse: 0, cadence: 2, blindage: -1 },
  },
];

export function appareil(id) {
  return APPAREILS.find((a) => a.id === id) ?? APPAREILS[0];
}

// Une livrée est un croisement : la silhouette vient de l'appareil, les
// couleurs du pilote. Preload.js génère les combinaisons sous cette clé.
export function livree(a, p) {
  return `avion_${a.id}_${p.id}`;
}
