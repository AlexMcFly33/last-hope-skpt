# Contexte projet

Shoot'em up vertical en pixel art, clin d'œil au groupe de ska
Les Skapitaines. Thème : compagnie aérienne fictive — les niveaux sont des
vols, les ennemis des appareils rivaux.

Projet personnel, pas de deadline. Priorité à la lisibilité du code et au
plaisir de bricoler dessus.

## Stack

- Phaser 3, JavaScript (pas de TypeScript, choix assumé)
- Vite pour le dev et le build
- Build statique, destiné à un hébergement type Netlify / Vercel / Pages
- Aucune dépendance au-delà de Phaser

## Décisions d'architecture à respecter

**Résolution interne fixe : 256×320**, définie dans `src/constantes.js`.
Tout se dessine dans ce repère. `pixelArt: true` et `Scale.FIT` font le
reste. Ne jamais raisonner en pixels écran.

**L'équipage est de la donnée, sur deux axes.** `src/pilotes.js` porte les
personnages (stats de base, livrée, teint), `src/appareils.js` porte
les appareils (silhouette, correctifs de stats). Les vies ne sont pas de la
donnée d'équipage : toute partie démarre à `VIES_DEPART` (constantes.js).
`src/equipage.js` est le seul endroit où les deux se rencontrent : il
additionne, borne les jauges à 1..5 et livre aux scènes des valeurs prêtes à
l'emploi — une scène en vol n'a jamais à savoir quel cran vient de qui.
Ajouter un pilote ou un appareil ne doit demander que son entrée dans le
tableau et son pochoir dans `Preload.js`, jamais une ligne de scène.

**Le score ne compte que les dégâts infligés.** Un tir qui porte vaut un
point (`DEGATS_PAR_TIR`), et rien d'autre n'en rapporte : pas de prime de fin
de vol, pas de bonus de survie. Un appareil coriace vaut donc mécaniquement
plus qu'un frêle, sans qu'aucun barème n'ait à être tenu à jour quelque part.
Une partie complète tourne autour de 240 points.

**Les appareils rivaux sont de la donnée** dans `src/ennemis.js` : un type y
porte sa livrée, sa résistance et sa manière de voler. Les comportements
(`VOLS`) se déclinent en deux temps facultatifs — `lancer` une fois au
largage, `piloter` à chaque frame — pour qu'un ennemi qui vole droit ne coûte
rien. Une vague désigne son type par son id, à défaut celui du vol : chaque vol
a sa faune, on ne croise pas les mêmes appareils au-dessus de Dakar et de
Kingston.

**Chaque boss a sa signature**, en deux moitiés déclarées dans `niveaux.js` et
exécutées par `Vol.js` : `boss.tir` choisit sa salve dans `SALVES` (l'éventail
arrose large, la rafale vise le joueur, le barrage sature) et
`boss.trajectoire` sa manière de tenir l'air dans `TRAJECTOIRES` (tangage lent,
piqué profond, lente pression). Un boss peut aussi appeler du renfort
(`boss.escorte`). Ajouter un motif se fait dans ces deux tables, jamais dans le
corps de la scène.

**Une trajectoire rend une altitude de consigne, pas une position.** La scène y
ramène le boss par la vitesse (`RAPPEL_BOSS`) au lieu de poser `y` : le corps
mène le sprite en physique arcade, et ce rappel continu évite la dérive qu'une
intégration de vitesse finirait par accumuler. Le va-et-vient horizontal, lui,
se fait tout seul au rebond sur les bords du monde.

**Les points de coque d'un boss se comptent en secondes de combat visées**,
jamais à l'estime : un joueur à trois canons crache une vingtaine de tirs par
seconde, et une valeur qui « a l'air de faire beaucoup » se volatilise en deux
secondes. Le tableau utile : à trois canons, un boss tombe en pv/14 secondes
environ ; à un seul, en pv/2,5. Viser la colonne deux ou trois canons, c'est
là que sera le joueur.

**La jauge du boss reste en haut**, sous le tableau de bord, là où l'œil va la
chercher. Le boss passe devant au sommet de son tangage : elle est opaque et
posée plus en profondeur que lui, donc lisible par-dessus.

**Un vol est un niveau, et c'est de la donnée.** `src/niveaux.js` porte la
campagne : pour chaque vol, son briefing (l'histoire racontée avant le
décollage), ses vagues scriptées et son boss. Les formations de vagues y sont
aussi (`positionsVague`), pour que `Vol.js` ne fasse que les jouer. Ajouter un
vol ne demande que son entrée ici et le pochoir de son boss dans `Preload.js`.

**La scène `Tuto` ne s'affiche qu'une fois**, entre le choix de l'appareil et
le briefing du premier vol. Elle construit sa légende depuis `bonus.js` :
ajouter un item là-bas le fait apparaître ici sans toucher la scène.

**La scène `Escale` fait les comptes entre deux vols.** `Vol` y passe la main
après le boss ; elle affiche les dégâts du vol qu'on vient de faire, le total
depuis le décollage et ce qui a été ramassé en chemin, puis enchaîne sur le
briefing suivant — ou sur `Fin` si c'était le dernier vol. C'est elle qui
décide, pas `Vol` : la scène de vol ne sait plus si elle était la dernière.
Deux compteurs de `Vol` ne servent qu'à ça et repartent de zéro à chaque
décollage : `degatsDuVol` et `ramassages`, là où le score cumulé traverse les
escales. La liste des items se construit depuis `bonus.js`.

**La scène `Briefing` précède toujours un vol.** On n'entre jamais dans `Vol`
directement : `Selection` et `Fin` passent par elle, elle transmet les bagages
(équipage, miles, vies, armement) à la scène de vol. Le texte est révélé ligne
à ligne ; un premier appui l'affiche d'un coup, le second décolle.

**Les bagages traversent les escales.** Miles, vies et cran d'armement passent
d'un vol au suivant via l'objet rendu par `Vol.bagages()`. Une nouvelle
tentative après échec repart sans bagages : `Vol.init` retombe alors sur ses
valeurs par défaut, ce qui suffit à remettre les compteurs à neuf.

**Les bonus sont de la donnée** dans `src/bonus.js`, qui porte aussi l'échelle
d'armement — les ramasser est le seul moyen de la gravir, la panne le seul
moyen de la redescendre. Le tirage est pondéré : changer un poids suffit à
rendre un item plus rare. Les malus pèsent volontairement plus lourd que les
bonus et la vie est rare (8%) : ramasser doit être un pari, pas un réflexe.
Aucun malus ne coûte de vie — le givre dégrade la cadence, la panne retire un
canon — pour punir sans jamais rendre la partie injouable.

**L'embarquement se fait en deux temps** dans `src/scenes/Selection.js` :
d'abord le pilote, ensuite l'appareil. La deuxième étape montre les jauges
combinées et distingue à la couleur ce qui est acquis du pilote, gagné grâce
à l'appareil, ou perdu en montant dedans.

**Les sprites sont générés en code** dans `src/scenes/Preload.js`
(`generateTexture`), en attendant de vrais assets. Les clés de texture
(`portrait_<pilote>`, `avion_<appareil>_<pilote>`, `ennemi`, `tir_joueur`,
`tir_ennemi`, `etoile`) forment le contrat : quand les PNG arriveront, seul
`Preload.js` change. Une livrée est un croisement — la silhouette vient de
l'appareil, les couleurs du pilote — et les seize combinaisons sont peintes
d'avance au chargement, seize pochoirs de 16x16 ne coûtant rien.

**Les projectiles sont poolés.** `this.tirsJoueur.get()` pour sortir un
tir, `remiser()` pour le ranger. Ne jamais créer ni détruire un projectile
en cours de partie. Les ennemis et les bonus largués, eux, sont créés/détruits
normalement (faible volume).

**Dans un `overlap`, le sprite se passe avant le groupe.** Phaser inverse
silencieusement les arguments du callback quand on écrit `overlap(groupe,
sprite)` : `collideHandler` renvoie sur `collideSpriteVsGroup(object2,
object1)`, et le callback reçoit le sprite en premier. Écrire `overlap(sprite,
groupe)` ou `overlap(groupe, groupe)` préserve l'ordre attendu. C'est ce qui
faisait remiser le boss au lieu du projectile qui le touchait.

**Le boss se déplace à la vitesse, jamais au tween.** En physique arcade c'est
le corps qui mène le sprite : un tween sur x/y serait écrasé à la frame
suivante. Son entrée en scène est donc pilotée depuis `update`.

**La musique ne démarre que dans `Menu.decoller()`**, déclenché par une
touche ou un clic. Les navigateurs bloquent toute lecture sans geste
utilisateur. C'est le seul point d'entrée valide pour le premier morceau. Les
fichiers sont chargés en amont par `Preload` depuis `public/audio/`, et pèsent
assez lourd pour justifier la jauge d'embarquement. Les bruitages, eux, ne se
jouent qu'en vol, donc bien après ce geste : ils n'ont pas cette contrainte.

**Les morceaux et leur enchaînement vivent dans `src/musique.js`**, pas dans
les scènes : le gestionnaire de son de Phaser est global, la musique ne
s'arrête pas à un changement de scène, donc c'est au module de retenir ce qui
tourne. `jouerMusique(scene, nom)` fait le fondu croisé et ne fait rien si le
morceau demandé tourne déjà — une scène peut donc l'appeler à chaque création
sans savoir d'où vient le joueur. L'intro accompagne tout l'avant-vol,
`Vol.create()` bascule sur le morceau de niveau. Un morceau marqué
`presente: false` n'est pas réclamé au chargement (même principe que
`LOGO_IMPORTE`) et son absence fait simplement silence : le fondu de sortie du
précédent a quand même lieu.

**Jamais de `localStorage` en direct : tout passe par `src/stockage.js`.** Un
navigateur peut refuser le stockage — navigation privée, cookies bloqués,
iframe restreinte — et l'accès jette alors dès la lecture de la propriété.
`Menu.create()` le lisait sans protection : le jeu restait noir, sans message.
`lire` et `ecrire` avalent l'exception ; sans stockage la partie tourne
normalement, elle oublie juste le record et le réglage du son.

**Le bouton de sourdine est partagé** (`src/sourdine.js`) et posé sur
`Selection` et `Tuto`. Deux points non évidents : son état vit en mémoire et
n'est *que* sauvegardé dans le stockage — sinon un navigateur qui le refuse
rendrait le bouton inerte, basculant le son sans jamais changer d'apparence —
et son gestionnaire appelle `evenement.stopPropagation()`, sans quoi le clic
continue jusqu'au `input.on('pointerdown')` de la scène, qui l'entend comme
« changer de pilote » ou « passer le tuto ».

**Les bruitages sont synthétisés en code** dans `src/sons.js`, comme les
sprites le sont dans `Preload.js` : une recette par son, rendue en tampon
WebAudio au chargement puis déposée dans le cache audio, où Phaser la lit
exactement comme un fichier. Les clés (`tir_1`..`tir_3`, `explosion`,
`explosion_boss`, `impact`, `bonus`, `malus`) sont le contrat ; le jour où de
vrais échantillons arriveront, seul `sons.js` changera. Sans WebAudio, la fabrique repart sans
rien et le jeu tourne en silence plutôt que de refuser de démarrer.

**L'arrivée du boss est une mise en scène, pas un simple déplacement.** Le
joueur perd la main : ses canons se taisent, il est ramené à sa marque (au
centre, en bas) par un rappel proportionnel, et le ciel se vide des tirs
encore en l'air — le laisser encaisser ce qu'il ne peut plus esquiver serait
injuste. Le boss descend, se fige `TEMPS_DE_GARDE_BOSS`, puis ouvre le feu :
c'est ce temps mort qui fait l'entrée en scène. Trois secondes environ, dont
la durée s'ajuste seule si on change l'altitude d'un boss.

**Le volume d'une recette ne dit pas sa puissance perçue.** À crête égale une
dent de scie porte bien moins qu'un carré, et une enveloppe qui s'éteint vite
laisse surtout du silence. Régler un bruitage à l'oreille du code ne marche
pas : mesurer le RMS et vérifier que l'échelle monte bien de `tir_1` à
`explosion_boss`, en gardant la crête sous 1 pour ne pas écrêter.

**Hitbox du joueur volontairement plus petite que le sprite**
(`setSize(6, 6, true)` pour un sprite 16×16). Convention du genre, à ne
pas « corriger ».

## Conventions de code

- Noms de variables et de méthodes en français pour la logique métier
  (`lacherEnnemi`, `encaisser`, `piloter`), API Phaser en anglais
- Une scène par fichier dans `src/scenes/`
- Commentaires courts, uniquement pour expliquer un *pourquoi* non évident

## Reste à faire

- Contrôles tactiles
- Vrais sprites et musique du groupe
- Le vrai logo du groupe : le déposer dans `public/logo.png` et passer
  `LOGO_IMPORTE` à true dans `constantes.js` (l'emblème peint sert de doublure)
- Un cinquième type d'appareil rival, et des vagues mixtes dans une même salve
- Une deuxième phase pour les boss (motif de salve qui change sous 50% de coque)
