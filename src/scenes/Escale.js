import Phaser from 'phaser';
import { LARGEUR, HAUTEUR, STYLE, STYLE_TITRE, TEXTE } from '../constantes.js';
import { creerCiel } from '../ciel.js';
import { niveau, estDernier, lignesTrajet } from '../niveaux.js';
import { BONUS, bonusTexture } from '../bonus.js';

const Y_NOM = 50;
const INTERLIGNE_TRAJET = 11;
// Écarts sous l'en-tête, dont la hauteur dépend du nombre de lignes du trajet.
const ECART_ABATTU = 6;
const ECART_DEGATS = 20;
const ECART_TOTAL = 14;
const ECART_TITRE_RAMASSE = 26;
const Y_PREMIER_ITEM = 150;
const INTERLIGNE = 22;
const X_ICONE = 44;
const X_TEXTE = 62;
const X_COMPTE = LARGEUR - 44;

// Ce délai de garde revient partout où l'on arrive sur ESPACE : sans lui, la
// touche encore enfoncée traverserait l'écran avant qu'on ait rien lu.
const DELAI_DE_GARDE = 400;

// Les comptes du vol qu'on vient de terminer. La liste des items se construit
// depuis bonus.js : en ajouter un le fait apparaître ici tout seul.
export default class Escale extends Phaser.Scene {
  constructor() {
    super('Escale');
  }

  init(donnees) {
    this.bagages = donnees ?? {};
    this.niveau = niveau(this.bagages.niveau ?? 0);
    this.degatsDuVol = donnees?.degatsDuVol ?? 0;
    this.ramassages = donnees?.ramassages ?? {};
  }

  create() {
    this.ciel = creerCiel(this);

    this.add.text(LARGEUR / 2, 26, 'ESCALE', STYLE_TITRE).setOrigin(0.5);
    this.add
      .text(LARGEUR / 2, Y_NOM, this.niveau.nom, { ...STYLE, color: TEXTE.accent })
      .setOrigin(0.5);

    // Le trajet sous le nom plutôt qu'à sa suite : sur une seule ligne, un long
    // trajet déborderait de l'écran.
    const trajet = lignesTrajet(this.niveau);
    this.add
      .text(LARGEUR / 2, Y_NOM + INTERLIGNE_TRAJET, trajet, {
        ...STYLE,
        color: TEXTE.accent,
        align: 'center',
      })
      .setOrigin(0.5, 0);

    // Tout ce qui suit descend d'autant que le trajet occupe de lignes.
    const bas = Y_NOM + INTERLIGNE_TRAJET + trajet.length * INTERLIGNE_TRAJET;

    this.add
      .text(LARGEUR / 2, bas + ECART_ABATTU, 'APPAREIL ADVERSE ABATTU', {
        ...STYLE,
        color: TEXTE.terne,
      })
      .setOrigin(0.5);

    this.ligne(bas + ECART_DEGATS, 'DEGATS DE CE VOL', this.degatsDuVol, TEXTE.clair);
    this.ligne(
      bas + ECART_DEGATS + ECART_TOTAL,
      'TOTAL DEPUIS LE DECOLLAGE',
      this.bagages.degats ?? 0,
      TEXTE.terne
    );

    this.add
      .text(LARGEUR / 2, bas + ECART_DEGATS + ECART_TOTAL + ECART_TITRE_RAMASSE, 'RAMASSE EN CHEMIN', {
        ...STYLE,
        color: TEXTE.accent,
      })
      .setOrigin(0.5);

    BONUS.forEach((bonus, i) => {
      const y = Y_PREMIER_ITEM + i * INTERLIGNE;
      const compte = this.ramassages[bonus.id] ?? 0;
      // Ce qu'on n'a pas croisé reste affiché, mais s'efface : la liste garde
      // la même forme d'un vol à l'autre, on la relit sans la relire.
      const couleur = compte === 0 ? TEXTE.terne : bonus.malus ? TEXTE.alerte : TEXTE.clair;

      this.add.image(X_ICONE, y, bonusTexture(bonus.id)).setAlpha(compte === 0 ? 0.35 : 1);
      this.add.text(X_TEXTE, y - 4, bonus.libelle, { ...STYLE, color: couleur });
      this.add.text(X_COMPTE, y - 4, String(compte), { ...STYLE, color: couleur }).setOrigin(1, 0);
    });

    const invite = this.add
      .text(
        LARGEUR / 2,
        HAUTEUR - 26,
        estDernier(this.bagages.niveau ?? 0) ? 'ESPACE : DERNIER RAPPORT' : 'ESPACE : VOL SUIVANT',
        STYLE
      )
      .setOrigin(0.5);
    this.tweens.add({ targets: invite, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.ouvertA = this.time.now;
    this.input.keyboard.on('keydown-SPACE', () => this.continuer());
    this.input.keyboard.on('keydown-ENTER', () => this.continuer());
    this.input.on('pointerdown', () => this.continuer());
  }

  update(temps, delta) {
    this.ciel.defiler(delta);
  }

  // Libellé à gauche, chiffre calé à droite : les nombres s'alignent d'un vol
  // à l'autre, on voit la progression sans lire.
  ligne(y, libelle, valeur, couleur) {
    this.add.text(X_ICONE - 8, y, libelle, { ...STYLE, color: TEXTE.terne });
    this.add.text(X_COMPTE, y, String(valeur), { ...STYLE, color: couleur }).setOrigin(1, 0);
  }

  continuer() {
    if (this.time.now - this.ouvertA < DELAI_DE_GARDE) return;

    const termine = this.bagages.niveau ?? 0;
    if (estDernier(termine)) {
      this.scene.start('Fin', { ...this.bagages, victoire: true });
      return;
    }
    this.scene.start('Briefing', { ...this.bagages, niveau: termine + 1 });
  }
}
