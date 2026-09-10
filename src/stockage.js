// Un navigateur peut refuser le stockage local : navigation privée, cookies
// bloqués, page enfermée dans une iframe restreinte. L'accès jette alors une
// exception dès la lecture de la propriété — ce qui suffisait à tuer l'écran de
// menu et à laisser le joueur devant un écran noir.
//
// Tout passe désormais par ces deux fonctions. Sans stockage le jeu tourne
// normalement, il oublie simplement le record et le réglage du son d'une visite
// à l'autre.
export function lire(cle, defaut = null) {
  try {
    return localStorage.getItem(cle) ?? defaut;
  } catch {
    return defaut;
  }
}

export function ecrire(cle, valeur) {
  try {
    localStorage.setItem(cle, String(valeur));
    return true;
  } catch {
    return false;
  }
}
