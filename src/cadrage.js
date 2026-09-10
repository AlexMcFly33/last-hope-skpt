// Une image importée n'a aucune raison de faire 16x16 comme les pochoirs : on
// la cale sur une case de taille fixe plutôt que de lui appliquer un facteur
// d'échelle qui supposerait sa taille d'origine. Partagé par le menu (logo) et
// l'écran de sélection (portraits, livrées).
export function caler(image, cote) {
  image.setScale(cote / Math.max(image.width, image.height));
}
