import Phaser from 'phaser';
import {
  LARGEUR,
  HAUTEUR,
  COULEURS,
  STYLE,
  TEXTE,
  VIES_DEPART,
  VIES_MAX,
  VITESSE_TIR_JOUEUR,
  VITESSE_TIR_ENNEMI,
  DEGATS_PAR_TIR,
} from '../constantes.js';
import { composer } from '../equipage.js';
import { creerCiel, ELAN_EN_VOL } from '../ciel.js';
import { jouerMusique } from '../musique.js';
import { niveau, positionsVague, bossTexture } from '../niveaux.js';
import { typeEnnemi, ennemiTexture, vol } from '../ennemis.js';
import { sonDuTir } from '../sons.js';
import {
  ARMES,
  CHANCE_LARGAGE,
  estMalus,
  DUREE_ENDUIT,
  FACTEUR_ENDUIT_CADENCE,
  FACTEUR_ENDUIT_VITESSE,
  bonusTexture,
  libelleBonus,
  tirerBonus,
} from '../bonus.js';

const TIRS_JOUEUR = 24;
const TIRS_ENNEMI = 32;
const VITESSE_BONUS = 45;
const RAYON_RAMASSAGE = 16;

// Le boss descend jusqu'à son altitude de consigne avant d'ouvrir le feu : le
// joueur a le temps de le voir arriver. Ensuite il y est rappelé en continu,
// d'autant plus fort qu'il s'en écarte.
const VITESSE_ENTREE_BOSS = 45;
const RAPPEL_BOSS = 2.5;
// Une fois à sa marque, le boss se stabilise avant d'ouvrir le feu : c'est ce
// temps mort qui fait l'entrée en scène.
const TEMPS_DE_GARDE_BOSS = 1000;
// Force du rappel qui ramène le joueur à sa marque pendant cette pause.
const RAPPEL_JOUEUR = 3;
// Sous le tableau de bord, là où l'œil va chercher une jauge de boss. Le boss
// passe devant au sommet de son tangage : la jauge est opaque et posée à une
// profondeur supérieure, elle reste lisible par-dessus lui.
const Y_JAUGE_BOSS = 40;

// Ranger un projectile dans son pool. Un tir n'est jamais détruit en vol :
// il repart au hangar et ressort au prochain appel à get().
function remiser(tir) {
  tir.disableBody(true, true);
}

// La signature de chaque boss : sa salve, rendue sous forme de vitesses de
// projectiles. Sortir un tir du pool et le placer est identique pour tous, seul
// ce qui sort du canon les distingue. Le boss désigne son motif dans niveaux.js.
const SALVES = {
  // Large et aveugle : il arrose devant lui, on le déborde par le côté.
  eventail: () => [
    [-50, VITESSE_TIR_ENNEMI],
    [0, VITESSE_TIR_ENNEMI],
    [50, VITESSE_TIR_ENNEMI],
  ],

  // Visée : deux traits rapides vers le joueur, légèrement ouverts. Rester
  // immobile sous lui ne pardonne pas.
  rafale: (boss, joueur) => {
    const dx = joueur.x - boss.x;
    const dy = Math.max(1, joueur.y - boss.y);
    const norme = Math.hypot(dx, dy);
    const vitesse = VITESSE_TIR_ENNEMI * 1.9;

    return [-0.16, 0.16].map((angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [
        ((dx * cos - dy * sin) / norme) * vitesse,
        ((dx * sin + dy * cos) / norme) * vitesse,
      ];
    });
  },

  // Saturation : cinq traits d'un coup, il ne laisse qu'un couloir à la fois.
  barrage: () => [-80, -40, 0, 40, 80].map((dx) => [dx, VITESSE_TIR_ENNEMI]),
};

// L'autre moitié de la signature d'un boss : à quelle altitude il doit se
// trouver à cet instant. La scène l'y ramène par la vitesse plutôt qu'en posant
// y — en physique arcade c'est le corps qui mène le sprite — et ce rappel
// continu évite toute dérive à la longue.
const TRAJECTOIRES = {
  // Lourd et régulier : il tangue lentement, on peut lire son creux à l'avance.
  tangage: (boss, temps) => boss.altitude + Math.sin(temps / 900) * 24,

  // Il pique loin dans le terrain puis remonte d'un trait. Combiné à sa rafale
  // visée, rester immobile devient intenable.
  pique: (boss, temps) => boss.altitude + Math.sin(temps / 520) * 62,

  // Une lente respiration : il pèse sur le joueur en descendant, puis relâche.
  pression: (boss, temps) => boss.altitude + Math.sin(temps / 1400) * 44,
};

export default class Vol extends Phaser.Scene {
  constructor() {
    super('Vol');
  }

  init(donnees) {
    // Le pilote et l'appareil sont deja combines : le vol lit des valeurs
    // toutes faites, il n'a pas a savoir laquelle vient de qui.
    this.equipage = composer(donnees?.piloteId, donnees?.appareilId);
    this.indexNiveau = donnees?.niveau ?? 0;
    this.niveau = niveau(this.indexNiveau);

    // Score, vies et armement traversent les escales : le vol suivant reprend
    // la partie là où le précédent l'a laissée. Une nouvelle tentative repart
    // des valeurs par défaut, parce qu'elle arrive ici sans bagages.
    this.degats = donnees?.degats ?? 0;
    this.viesRestantes = donnees?.vies ?? VIES_DEPART;
    this.arme = donnees?.arme ?? 0;

    // Le score cumulé traverse les escales, mais l'escale rend compte du vol
    // qu'on vient de faire : ces deux-là repartent de zéro à chaque décollage.
    this.degatsDuVol = 0;
    this.ramassages = {};

    this.dernierTir = 0;
    this.finDuRepit = 0;
    this.finDeLEnduit = 0;
    this.indexVague = 0;
    this.boss = null;
    this.bossEnPlace = false;
    this.bossVaincu = false;
    this.arriveeBoss = 0;
  }

  create() {
    this.ciel = creerCiel(this, ELAN_EN_VOL);
    // Le jeu commence vraiment ici : l'intro se fond, le morceau de vol prend
    // le relais et tiendra jusqu'au retour en salle d'embarquement.
    jouerMusique(this, 'vol');

    this.joueur = this.physics.add
      .sprite(LARGEUR / 2, HAUTEUR - 48, this.equipage.texture)
      .setCollideWorldBounds(true);
    // Hitbox volontairement plus petite que le sprite 16x16 : convention du
    // genre, le joueur doit pouvoir se faufiler.
    this.joueur.body.setSize(6, 6, true);

    this.vitesse = this.equipage.vitesse;
    this.cadence = this.equipage.cadence;

    this.tirsJoueur = this.creerPool('tir_joueur', TIRS_JOUEUR);
    this.tirsEnnemi = this.creerPool('tir_ennemi', TIRS_ENNEMI);
    // Faible volume, durée de vie longue : les ennemis se créent et se
    // détruisent normalement, pas de pool ici. Idem pour les bonus largués.
    this.ennemis = this.physics.add.group();
    this.largages = this.physics.add.group();

    this.commandes = this.input.keyboard.addKeys({
      gauche: Phaser.Input.Keyboard.KeyCodes.LEFT,
      droite: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      haut: Phaser.Input.Keyboard.KeyCodes.UP,
      bas: Phaser.Input.Keyboard.KeyCodes.DOWN,
      feu: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.physics.add.overlap(this.tirsJoueur, this.ennemis, this.abattre, null, this);
    this.physics.add.overlap(this.joueur, this.ennemis, this.encaisser, null, this);
    this.physics.add.overlap(this.joueur, this.tirsEnnemi, this.encaisser, null, this);
    this.physics.add.overlap(this.joueur, this.largages, this.ramasser, null, this);

    this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: this.riposter,
      callbackScope: this,
    });

    this.programmerVague();
    this.afficherTableauDeBord();
  }

  update(temps, delta) {
    this.ciel.defiler(delta);
    this.piloter(temps);
    this.piloterEnnemis(temps);
    this.rapatrier();
    this.surveillerLeVol(temps);
  }

  creerPool(cle, quantite) {
    const pool = this.physics.add.group({ defaultKey: cle, maxSize: quantite });
    pool.createMultiple({ key: cle, quantity: quantite, active: false, visible: false });
    pool.children.iterate((tir) => remiser(tir));
    return pool;
  }

  // --- Déroulé du vol ------------------------------------------------------

  // Les vagues s'enchaînent d'elles-mêmes : chacune programme la suivante. Le
  // ciel se vide alors tout seul quand la dernière est passée.
  programmerVague() {
    const vague = this.niveau.vagues[this.indexVague];
    if (!vague) return;

    this.time.delayedCall(vague.delai, () => {
      positionsVague(vague).forEach(({ x, y }) => this.lacherEnnemi(x, y, vague));
      this.indexVague += 1;
      this.programmerVague();
    });
  }

  // Le type vient de la vague, à défaut de celui du vol : une vague n'a besoin
  // de le nommer que lorsqu'elle sort de l'ordinaire du niveau.
  lacherEnnemi(x, y, vague) {
    const type = typeEnnemi(vague.ennemi ?? this.niveau.ennemi);
    const ennemi = this.ennemis.create(x, y, ennemiTexture(type.id));

    ennemi.body.setSize(10, 10, true);
    ennemi.pv = type.pv;
    // Surtout pas 'type' : Phaser s'en sert déjà sur ses GameObjects.
    ennemi.modele = type.id;
    // Un vol en sinus se sert de la dérive comme amplitude, pas comme vitesse.
    ennemi.setVelocity(vol(type.id).piloter ? 0 : vague.derive ?? 0, vague.vitesse);
    vol(type.id).lancer?.(ennemi, vague);
  }

  piloterEnnemis(temps) {
    this.ennemis.getChildren().forEach((ennemi) => {
      if (ennemi.active) vol(ennemi.modele).piloter?.(ennemi, temps);
    });
  }

  surveillerLeVol(temps) {
    if (this.bossVaincu) return;
    if (this.boss) {
      this.piloterLeBoss(temps);
      return;
    }
    // Le boss ne se présente qu'une fois la dernière vague passée et le ciel
    // vide : deux escadrilles à la fois seraient illisibles.
    if (this.indexVague < this.niveau.vagues.length) return;
    if (this.ennemis.countActive(true) > 0) return;

    this.faireEntrerLeBoss();
  }

  // --- Boss ----------------------------------------------------------------

  faireEntrerLeBoss() {
    const b = this.niveau.boss;

    this.boss = this.physics.add.sprite(LARGEUR / 2, -24, bossTexture(this.niveau));
    this.boss.pv = b.pv;
    this.boss.body.setSize(this.boss.width - 8, this.boss.height - 6, true);
    this.boss.setVelocityY(VITESSE_ENTREE_BOSS);

    // Le sprite d'abord : passé en second, Phaser inverse les arguments du
    // callback (collideHandler renvoie sur collideSpriteVsGroup(object2, object1)).
    this.physics.add.overlap(this.boss, this.tirsJoueur, this.toucherBoss, null, this);
    this.physics.add.overlap(this.joueur, this.boss, this.encaisser, null, this);

    this.nomBoss = this.add
      .text(LARGEUR / 2, Y_JAUGE_BOSS - 10, b.nom, { ...STYLE, color: TEXTE.accent })
      .setOrigin(0.5)
      .setDepth(10);
    this.jaugeBoss = this.add.graphics().setDepth(10);
    this.rafraichirJaugeBoss();

    // Le joueur n'a plus la main le temps de l'entrée : il serait injuste de
    // le laisser encaisser des tirs qu'il ne peut plus esquiver. Le ciel se
    // vide de ce qui restait en l'air.
    this.tirsEnnemi.children.iterate((tir) => {
      if (tir.active) remiser(tir);
    });

    this.annoncer('CANONS VERROUILLES');
    this.rafraichirTableauDeBord();

    // Certains n'acceptent pas le duel et appellent du renfort.
    if (b.escorte) {
      this.renfort = this.time.addEvent({
        delay: b.escorte.delai,
        loop: true,
        callback: () => this.lacherEscorte(b.escorte),
        callbackScope: this,
      });
    }
  }

  lacherEscorte(escorte) {
    const vague = { ennemi: escorte.ennemi, vitesse: 55, derive: 45 };
    positionsVague({ motif: 'ligne', nombre: escorte.nombre })
      .forEach(({ x, y }) => this.lacherEnnemi(x, y, vague));
  }

  // On pilote le boss à la vitesse plutôt qu'au tween : en physique arcade,
  // c'est le corps qui mène le sprite, un tween sur x/y serait écrasé.
  piloterLeBoss(temps) {
    const b = this.niveau.boss;

    if (!this.bossEnPlace) {
      if (this.boss.y < b.altitude) return;

      // Arrivé à sa marque, il se fige un instant : le temps que le joueur le
      // voie et rejoigne la sienne.
      this.boss.setVelocityY(0);
      if (this.arriveeBoss === 0) this.arriveeBoss = temps;
      if (temps - this.arriveeBoss < TEMPS_DE_GARDE_BOSS) return;

      this.bossEnPlace = true;
      this.boss.setVelocity(b.vitesse, 0).setCollideWorldBounds(true).setBounce(1, 0);
      this.tirBoss = this.time.addEvent({
        delay: b.cadence,
        loop: true,
        callback: this.salveBoss,
        callbackScope: this,
      });

      // Il est en place et ouvre le feu : le duel commence, les canons aussi.
      this.annoncer('FEU A VOLONTE');
      this.rafraichirTableauDeBord();
      return;
    }

    // Le va-et-vient horizontal se fait tout seul au rebond ; seule l'altitude
    // demande une correction à chaque frame.
    const cible = (TRAJECTOIRES[b.trajectoire] ?? TRAJECTOIRES.tangage)(b, temps);
    this.boss.setVelocityY((cible - this.boss.y) * RAPPEL_BOSS);
  }

  salveBoss() {
    if (!this.boss) return;

    const motif = SALVES[this.niveau.boss.tir] ?? SALVES.eventail;
    motif(this.boss, this.joueur).forEach(([vx, vy]) => {
      const x = this.boss.x;
      const y = this.boss.y + 14;
      const tir = this.tirsEnnemi.get(x, y);
      if (!tir) return;

      tir.enableBody(true, x, y, true, true);
      tir.setVelocity(vx, vy);
    });
  }

  toucherBoss(boss, tir) {
    remiser(tir);
    boss.pv -= DEGATS_PAR_TIR;
    this.degats += DEGATS_PAR_TIR;
    this.degatsDuVol += DEGATS_PAR_TIR;
    this.rafraichirJaugeBoss();
    this.rafraichirTableauDeBord();

    boss.setTintFill(0xffffff);
    this.time.delayedCall(60, () => {
      if (this.boss === boss) boss.clearTint();
    });

    if (boss.pv <= 0) this.vaincreBoss();
  }

  rafraichirJaugeBoss() {
    const part = Math.max(0, this.boss.pv) / this.niveau.boss.pv;

    this.jaugeBoss.clear();
    this.jaugeBoss.fillStyle(COULEURS.jauge, 1);
    this.jaugeBoss.fillRect(48, Y_JAUGE_BOSS, 160, 4);
    this.jaugeBoss.fillStyle(COULEURS.bossJauge, 1);
    this.jaugeBoss.fillRect(48, Y_JAUGE_BOSS, 160 * part, 4);
  }

  vaincreBoss() {
    this.bossVaincu = true;
    this.son('explosion_boss');

    this.tirBoss?.remove();
    this.renfort?.remove();
    this.boss.destroy();
    this.boss = null;
    this.jaugeBoss.destroy();
    this.nomBoss.destroy();

    this.rafraichirTableauDeBord();
    this.annoncer('APPAREIL ADVERSE ABATTU');

    // On passe la main à l'escale, qui fait les comptes du vol et enchaîne.
    this.time.delayedCall(1600, () =>
      this.scene.start('Escale', {
        ...this.bagages(),
        degatsDuVol: this.degatsDuVol,
        ramassages: this.ramassages,
      })
    );
  }

  // Ce qu'un vol transmet au suivant.
  bagages() {
    return {
      piloteId: this.equipage.pilote.id,
      appareilId: this.equipage.appareil.id,
      niveau: this.indexNiveau,
      degats: this.degats,
      vies: this.viesRestantes,
      arme: this.arme,
    };
  }

  // --- Tableau de bord -----------------------------------------------------

  afficherTableauDeBord() {
    this.compteur = this.add.text(6, 6, '', STYLE).setDepth(10);
    this.etiquetteArme = this.add.text(6, 18, '', STYLE).setDepth(10);
    this.etiquetteVol = this.add
      .text(LARGEUR / 2, 6, this.niveau.nom, { ...STYLE, color: TEXTE.terne })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.icones = [];
    this.rafraichirTableauDeBord();
  }

  rafraichirTableauDeBord() {
    this.compteur.setText(`${String(this.degats).padStart(5, '0')} DEGATS`);

    const [libelle, couleur] = this.etatDesCanons();
    this.etiquetteArme.setText(libelle);
    this.etiquetteArme.setColor(couleur);

    // Les icônes de vies sont l'appareil en vol, jamais un asset à part.
    this.icones.forEach((icone) => icone.destroy());
    this.icones = Array.from({ length: this.viesRestantes }, (rien, i) =>
      this.add
        .image(LARGEUR - 10 - i * 12, 10, this.equipage.texture)
        .setScale(0.6)
        .setDepth(10)
    );
  }

  // Ce que raconte l'étiquette d'armement, de la contrainte la plus forte à la
  // plus faible : verrouillés, givrés, ou simplement au cran courant.
  etatDesCanons() {
    if (this.canonsVerrouilles()) return ['CANONS VERROUILLES', TEXTE.alerte];
    if (this.alourdi()) return [`CANONS ${this.arme + 1} ALOURDIS`, TEXTE.accent];
    return [`CANONS ${this.arme + 1}`, TEXTE.terne];
  }

  // Un mot au centre, le temps d'un battement : le joueur doit savoir ce qu'il
  // vient de ramasser sans quitter son appareil des yeux.
  annoncer(texte) {
    const mot = this.add
      .text(LARGEUR / 2, HAUTEUR - 80, texte, { ...STYLE, color: TEXTE.accent })
      .setOrigin(0.5)
      .setDepth(10);

    this.tweens.add({
      targets: mot,
      alpha: 0,
      y: mot.y - 14,
      duration: 1000,
      onComplete: () => mot.destroy(),
    });
  }

  // --- Joueur --------------------------------------------------------------

  // Un bruitage absent (WebAudio indisponible) ne doit jamais interrompre un
  // vol : on joue ce qui existe, on ignore le reste.
  son(cle) {
    if (this.cache.audio.exists(cle)) this.sound.play(cle);
  }

  alourdi() {
    return this.time.now < this.finDeLEnduit;
  }

  // On ne mitraille pas un adversaire qui descend encore. Les tirs déjà en
  // l'air, eux, portent : une dernière volée qui touche reste méritée.
  canonsVerrouilles() {
    return this.boss !== null && !this.bossEnPlace;
  }

  piloter(temps) {
    // Pendant l'entrée du boss, le joueur n'a pas la main : on le ramène à sa
    // marque, au centre et en bas, pour que le duel commence à égalité.
    if (this.canonsVerrouilles()) {
      this.rejoindreLaMarque();
      return;
    }

    const { gauche, droite, haut, bas, feu } = this.commandes;
    const vx = (droite.isDown ? 1 : 0) - (gauche.isDown ? 1 : 0);
    const vy = (bas.isDown ? 1 : 0) - (haut.isDown ? 1 : 0);

    // Lesté, l'appareil se traîne : c'est le premier symptôme qu'on sent.
    const alourdi = this.alourdi();
    const vitesse = alourdi ? this.vitesse * FACTEUR_ENDUIT_VITESSE : this.vitesse;

    this.joueur.setVelocity(vx * vitesse, vy * vitesse);
    // Une diagonale ne doit pas aller plus vite qu'une ligne droite.
    if (vx !== 0 && vy !== 0) this.joueur.body.velocity.scale(Math.SQRT1_2);

    const cadence = alourdi ? this.cadence * FACTEUR_ENDUIT_CADENCE : this.cadence;
    if (feu.isDown && !this.canonsVerrouilles() && temps - this.dernierTir >= cadence) {
      this.dernierTir = temps;
      this.tirer();
    }
  }

  // On y va à la vitesse plutôt qu'en posant la position : c'est le corps qui
  // mène le sprite en physique arcade, et le rappel proportionnel fait un
  // ralenti naturel en fin de course.
  rejoindreLaMarque() {
    this.joueur.setVelocity(
      (LARGEUR / 2 - this.joueur.x) * RAPPEL_JOUEUR,
      (HAUTEUR - 48 - this.joueur.y) * RAPPEL_JOUEUR
    );
  }

  // Un cran d'armement de plus, un canon de plus : les décalages viennent de
  // bonus.js, la scène ne connaît pas l'échelle.
  tirer() {
    // Une salve, un bruit : trois canons ne font pas trois détonations.
    this.son(sonDuTir(this.arme));

    ARMES[this.arme].canons.forEach((decalage) => {
      const x = this.joueur.x + decalage;
      const y = this.joueur.y - 8;
      const tir = this.tirsJoueur.get(x, y);
      if (!tir) return;

      tir.enableBody(true, x, y, true, true);
      tir.setVelocityY(VITESSE_TIR_JOUEUR);
    });
  }

  riposter() {
    const tireurs = this.ennemis.getMatching('active', true);
    if (tireurs.length === 0) return;

    const ennemi = Phaser.Utils.Array.GetRandom(tireurs);
    const tir = this.tirsEnnemi.get(ennemi.x, ennemi.y + 8);
    if (!tir) return;

    tir.enableBody(true, ennemi.x, ennemi.y + 8, true, true);
    tir.setVelocityY(VITESSE_TIR_ENNEMI);
  }

  // Le score ne compte que ce qui porte : un tir encaissé vaut un point, que
  // l'appareil tombe ou non.
  abattre(tir, ennemi) {
    remiser(tir);
    ennemi.pv -= DEGATS_PAR_TIR;
    this.degats += DEGATS_PAR_TIR;
    this.degatsDuVol += DEGATS_PAR_TIR;

    if (ennemi.pv <= 0) {
      this.son('explosion');
      this.larguerBonus(ennemi.x, ennemi.y);
      ennemi.destroy();
    } else {
      // Un coriace doit montrer qu'il encaisse, sinon on le croit invulnérable.
      ennemi.setTintFill(0xffffff);
      this.time.delayedCall(50, () => ennemi.active && ennemi.clearTint());
    }

    this.rafraichirTableauDeBord();
  }

  // --- Bonus ---------------------------------------------------------------

  // Un appareil abattu lâche parfois quelque chose. Le tirage pondéré décide
  // seulement de quoi : la chance de largage, elle, est la même pour tous.
  larguerBonus(x, y) {
    if (Math.random() > CHANCE_LARGAGE) return;

    const id = tirerBonus();
    const objet = this.largages.create(x, y, bonusTexture(id));
    objet.setData('bonus', id);
    objet.setVelocityY(VITESSE_BONUS);
    // Le joueur n'a que 6x6 de hitbox : sans cette générosité, ramasser un
    // bonus demanderait plus de précision qu'esquiver un tir.
    objet.body.setSize(RAYON_RAMASSAGE, RAYON_RAMASSAGE, true);
  }

  ramasser(joueur, objet) {
    const id = objet.getData('bonus');
    objet.destroy();
    this.ramassages[id] = (this.ramassages[id] ?? 0) + 1;

    if (id === 'vie') {
      this.viesRestantes = Math.min(VIES_MAX, this.viesRestantes + 1);
    } else if (id === 'arme') {
      this.arme = Math.min(ARMES.length - 1, this.arme + 1);
    } else if (id === 'enduit') {
      this.finDeLEnduit = this.time.now + DUREE_ENDUIT;
      this.joueur.setTint(COULEURS.bonusEnduit);
      // Le tableau de bord ne se rafraîchit que sur événement : il faut donc
      // le rappeler à la fin. Le test protège du cas où un second sac a été
      // ramassé entre-temps : c'est au sien de rendre la livrée.
      this.time.delayedCall(DUREE_ENDUIT, () => {
        if (!this.alourdi()) this.joueur.clearTint();
        this.rafraichirTableauDeBord();
      });
    } else if (id === 'panne') {
      this.arme = Math.max(0, this.arme - 1);
    }

    this.son(estMalus(id) ? 'malus' : 'bonus');
    this.annoncer(libelleBonus(id));
    this.rafraichirTableauDeBord();
  }

  // --- Dégâts --------------------------------------------------------------

  encaisser(joueur, agresseur) {
    if (this.time.now < this.finDuRepit) return;

    // Un ennemi percuté s'écrase avec nous, un tir retourne au hangar. Le boss,
    // lui, ne bronche pas : seuls nos tirs l'entament.
    if (this.ennemis.contains(agresseur)) agresseur.destroy();
    else if (agresseur !== this.boss) remiser(agresseur);

    this.son('impact');
    this.viesRestantes -= 1;
    this.rafraichirTableauDeBord();

    if (this.viesRestantes <= 0) {
      this.scene.start('Fin', { ...this.bagages(), victoire: false });
      return;
    }

    const repit = this.equipage.repit;
    this.finDuRepit = this.time.now + repit;

    const clignotement = this.tweens.add({
      targets: joueur,
      alpha: 0.2,
      duration: 120,
      yoyo: true,
      repeat: -1,
    });
    this.time.delayedCall(repit, () => {
      clignotement.stop();
      joueur.setAlpha(1);
    });
  }

  // Tout ce qui sort du cadre est rangé plutôt que détruit.
  rapatrier() {
    this.tirsJoueur.children.iterate((tir) => {
      if (tir.active && tir.y < -8) remiser(tir);
    });
    this.tirsEnnemi.children.iterate((tir) => {
      if (tir.active && (tir.y > HAUTEUR + 8 || tir.x < -8 || tir.x > LARGEUR + 8)) remiser(tir);
    });
    // Copie du tableau : destroy() retire l'élément du groupe en cours de route.
    [...this.ennemis.getChildren()].forEach((ennemi) => {
      if (ennemi.y > HAUTEUR + 16) ennemi.destroy();
    });
    [...this.largages.getChildren()].forEach((objet) => {
      if (objet.y > HAUTEUR + 8) objet.destroy();
    });
  }
}
