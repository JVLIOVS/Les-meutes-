# EMMET — Dossier de reprise pour Claude Code

**Vision produit, état réel du prototype, audit et feuille de route**  
Date : 26 octobre 2026. Langue du produit : français. Porteur du projet : Julious / Studio Julious, appellation présente dans le prototype.  
Référence auditée : **Prototype 03 — Fondations**, commit `ee74de4224dca17195c0a50f372d201d2d0a1e60`.

> Instruction fondamentale à l’agent repreneur : le prototype constitue une expérience jouable qui matérialise une partie des intentions. Il ne constitue pas le cahier des charges final. Ne transforme pas ses limites, ses raccourcis et ses paramètres actuels en décisions créatives immuables. Préserve les acquis validés, identifie les écarts, puis propose une amélioration cohérente.

## 1. Lecture rapide pour repartir correctement

EMMET est devenu un **jeu autonome de construction et de défense urbaine par vagues**, distinct de STREETZ. Le joueur rebâtit des services, déploie des unités, protège les bâtiments et doit empêcher une foule hostile de prendre le palais présidentiel. L’intérêt recherché associe le plaisir de bâtir, l’anticipation des rassemblements, la pression du nombre et des interventions spectaculaires mais compréhensibles.

La dernière direction explicite privilégie ce rôle de gestion et de défense. Les idées antérieures de monde ouvert GTA mobile, de clans, de récupération de vêtements et de double rôle appartiennent à l’historique et à des pistes futures : elles ne sont pas toutes à réintroduire dans EMMET par défaut.

La V03 est un jeu **solo de navigateur**, en JavaScript natif, avec rendu Canvas 2D isométrique, neuf emplacements de construction, six fiches de difficulté, sauvegarde locale et musique synthétisée. Il n’existe ni serveur de jeu, ni multijoueur, ni version native mobile. Les six quartiers ne sont pas six cartes géométriquement distinctes.

Le prototype commence maintenant avec **un seul bâtiment : le palais**. Il n’offre aucune troupe ni aucun autre service construit. Ce point répond à une demande répétée après des versions qui imposaient plusieurs bâtiments. Ne pas le faire régresser.

**Diagnostic de direction :** le concept possède une boucle identifiable, mais la sensation de ville vivante, la profondeur de construction et la simulation de foule sont encore beaucoup plus modestes que la vision. La priorité recommandée est une mission de référence excellente, mesurable et lisible, avant l’accumulation de systèmes.

### Statut des informations dans ce dossier

- **Intention utilisateur** : formulée dans les échanges ; ce n’est pas nécessairement implémenté.
- **Implémenté** : retrouvé dans les sources de la V03.
- **Vérifié maintenant** : confirmé par inspection et/ou exécution lors de cet audit.
- **Validation antérieure** : contrôle navigateur consigné dans `docs/validation.md`, non rejoué intégralement lors de ce débrief.
- **Recommandation** : proposition de l’auteur du présent audit ; à discuter ou expérimenter, pas une demande déjà approuvée.
- **Risque à tester** : déduit du code, sans preuve d’incident dans une partie ordinaire.

## 2. Historique : ce qu’on voulait réellement faire

### 2.1. Vision fondatrice de STREETZ

Le point de départ était un jeu mobile inspiré de la liberté d’un GTA, avec une identité propre : plusieurs joueurs réels sur une carte, liberté d’action, conséquences des choix, collaboration ou affrontement, clans, solo et groupes privés avec code d’accès. S’y ajoutaient progression de compétences, armes variées, apparences marquantes et un QG que l’on construit et personnalise pour préparer son matériel, ses missions et ses contacts.

Une préférence importante a ensuite été précisée : l’équipement devait exister dans le monde et s’obtenir dans l’action. Exemple évoqué : démarrer très peu équipé, récupérer bonnet, protection, pantalon ou chaussures sur d’autres personnages, plutôt que tout gérer dans un menu cosmétique séparé. Les échanges devaient mettre clairement en avant une amélioration et rendre les échanges purement esthétiques plus discrets.

**Ce dossier n’est pas un audit de réalisation de STREETZ.** Le lien historique fourni est `https://github.com/JVLIOVS/streetz`. Aucune conclusion ici ne prouve que les systèmes ci-dessus existent dans ce dépôt. EMMET est une autre base ; ne pas supposer que ce dépôt GitHub contient la V03.

### 2.2. L’idée du mode émeute

Une première branche conceptuelle proposait de nombreux joueurs, la prise de lieux, des barricades, des vagues et une progression d’objectifs : petit commissariat, mairie, préfecture, assemblée, sénat, base militaire, palais présidentiel. L’habillage narratif devait faire comprendre une population opprimée, dans une fiction suffisamment distante de l’actualité pour éviter une transposition politique trop directe.

Deux rôles ont été envisagés : agir du côté de la foule ou tenir les positions du côté des forces de l’ordre. Des idées de bande, d’XP, de deck d’équipe, de stratégie et de séquences d’action ont circulé. Ce stade relevait de l’exploration, pas d’un design final stabilisé.

Les retours utilisateurs ont ensuite pointé : menus d’achat trop envahissants pendant le jeu ; barricades peu satisfaisantes ; vagues qui semblaient se bloquer autour de la troisième ; équipement trop réduit ; échanges de vêtements répétitifs et sans intérêt ; impossibilité de choisir certains rôles malgré les changements annoncés ; manque de foule, de meute et de progression visible des adversaires. Des PNJ filmant et des caméras de surveillance ont été demandés comme détails de vie.

Ces retours sont un signal de méthode : **une fonctionnalité annoncée doit être visible et testable dans le parcours réel**, et pas seulement présente dans un texte ou dans un menu.

### 2.3. Décision structurante : un jeu séparé

L’utilisateur a ensuite demandé explicitement de recréer un jeu à part, plutôt orienté construction et défense par vagues. L’idée : la ville remplace le circuit traditionnel du tower defense. Des rassemblements arrivent de différents accès, convergent, attaquent les commerces ou les institutions et peuvent se rapprocher du dirigeant. Le joueur organise ses moyens, fortifie ses immeubles et bloque des artères ; la foule peut aussi dresser des obstacles.

Le spectaculaire doit venir des mouvements collectifs, de la densité, des variations de vitesse, des interventions et de la dégradation visible de la ville. L’utilisateur a évoqué filets, eau, drones, grenades de désencerclement et hélicoptères. Les termes et effets précis peuvent être fictionnalisés. Les armes létales et les équipements militaires ont été évoqués plus tôt, mais **ne sont pas implémentés dans la V03** et ne constituent pas une obligation pour la prochaine version.

### 2.4. Direction la plus récente : reconstruire un pays sécurisé

Les demandes récentes ajoutent une dimension de reconstruction : commencer avec presque rien, développer un petit service de maintien de l’ordre, restaurer des institutions et bâtir progressivement une ville ou un pays capable de tenir dans un contexte tendu.

Demandes concrètes à préserver :

1. Un seul bâtiment au départ ; construire les autres et comprendre leur utilité.
2. Des rassemblements arrivant de plus loin pour laisser le temps de préparer les défenses ; davantage de personnes et une meilleure sensation de masse.
3. Des constructions qui débloquent réellement de nouvelles troupes ou des atouts.
4. Des bâtisseurs et réparateurs permettant de restaurer les dégâts.
5. Des barricades de rue et protections de bâtiments qui évoluent.
6. Des adversaires plus complexes stratégiquement avec la progression, pas seulement plus résistants.
7. Un palais présidentiel identifiable sur la carte, objectif décisif de la foule.
8. Après sa chute : une séquence de trois à cinq secondes où la foule entre en masse, capture le chef d’État et renverse le régime.
9. Des mouvements, impacts et scènes d’intervention plus dynamiques ; voir clairement quand un personnage casse quelque chose.
10. Des hélicoptères face aux fortes concentrations.
11. Une musique mêlant hip-hop/rap et épique.

**Nuance sur le départ :** « commencer avec rien » puis « un bâtiment » ont été concrétisés par un palais seul et du budget. Un palais n’est pas encore un petit service de départ. Si l’on veut raconter une montée depuis une implantation modeste, il reste à choisir entre un palais déjà là mais vulnérable, une institution minimale évolutive, ou des scénarios différents. Ne pas ajouter trois bâtiments imposés pour résoudre cette tension.

## 3. Intention, réalisation et écart restant

| Sujet | Intention | Réalisation V03 | Écart / décision restante |
|---|---|---|---|
| Identité | Jeu indépendant, touche urbaine personnelle | EMMET, Nacreville fictive, interface sombre, ville isométrique | Identité artistique encore surtout procédurale ; univers et personnages à approfondir |
| Départ | Partir de très peu et bâtir | Un palais, neuf terrains vides, zéro troupe ; budget de 1 000 à 1 550 | Le budget permet beaucoup de déploiement initial ; progression de pauvreté vers puissance encore courte |
| Construction | Un vrai plaisir de bâtir et de développer le pays | Neuf types de services ; un exemplaire de chaque ; emplacements fixes | Pas de placement libre, routes construites, réseau d’approvisionnement, population ou territoire évolutif |
| Utilité des bâtiments | Débloquer troupes, protections et économie | Fonctions et dépendances réelles ; cartes consultables même verrouillées | À démontrer par un apprentissage en jeu ; peu d’effets économiques visibles dans la ville |
| Foule | Nombre, meute, rassemblement, vélocité | Agents, groupes d’apparition, six profils, marche/recul/frappe | Pas de comportement collectif riche, pression physique, meneurs ou dynamique sociale autonome |
| Distance | Préparer longtemps avant le contact | Approches rallongées de sept cases | Géométrie très régulière ; arrivées parfois hors cadre selon le zoom ; temps d’anticipation à mesurer |
| Défenses | Bloquer et adapter les artères | Barricades destructibles, détour par coût de chemin | Barricade sur une case ; pas de tracé de ligne, raccordement, portes ou prévisualisation des flux |
| Immeubles | Voir et faire progresser les protections | Façade séparée de la structure ; trois niveaux visibles | Pas de sections de façade indépendantes, matériaux ou points d’entrée multiples |
| Réparation | Des bâtisseurs et réparateurs | Chantier, réparations automatiques et ordres payants ; animation de bâtisseurs | Pas d’escouades logistiques autonomes avec trajet, affectation et danger propres |
| Interventions | Action lisible, percutante, différenciée | Formations, poses, eau/filets/impacts, recul | Les dégâts sont continus ; les gestes sont des cadences visuelles, pas des contacts synchronisés |
| Hélicoptères | Intervention forte face à la masse | Unité aérienne, recherche de densité, ralentissement, rotor/projecteur | Pas de mission d’extraction, ravitaillement, carburant ou trajectoire cinématographique élaborée |
| Palais | Véritable entrée et capture | Intérieur révélé, 48 acteurs franchissent le portail, dirigeant escorté ; 4,8 s | Scène scriptée indépendante de la foule réelle ; peu de variation selon la bataille |
| Campagne | Progression de quartiers et institutions | Six configurations de difficulté et déblocage par victoire | Même carte, même palais à tous les niveaux ; plusieurs textes historiques restent incohérents |
| Pays vivant | Restaurer institutions, sécurité et confiance | Budget, services, jauge de confiance, XP/étoiles | Pas de citoyens autonomes, élections, demandes sociales, économie simulée ou continuité de la ville |
| Double rôle | Défense et foule jouables | Non présent dans cette base autonome | Ancienne piste ; ne pas annoncer un mode jouable qui n’existe pas |
| Online | Collaboration / clans / serveurs privés | Aucun | Vision STREETZ, hors périmètre du prototype EMMET actuel |
| Audio | Hip-hop/rap et épique | Instrumental synthétique original à 86 BPM, couches selon phase | Pas de chant rap, bibliothèque de bruitages ou mixage final |
| PNJ filmant / surveillance | Détails de vie urbaine | Pas de système comportemental de témoins filmant validé par cet audit | Besoin secondaire à réévaluer après la foule et la lecture du jeu |

## 4. Inventaire exact de la V03

### 4.1. Boucle de jeu

Campagne → choix du quartier déverrouillé → préparation sans limite de temps → construction du commandement → autres services et unités → lancement d’une vague → interventions et réparations → récompense → accalmie de 18 secondes → vague suivante ou bilan.

Une vague se termine quand toutes les apparitions sont traitées et qu’il ne reste plus de foule active en rassemblement ou en marche. Les personnes dispersées peuvent encore quitter la carte. Le jeu ne doit pas terminer une vague sur un simple délai arbitraire.

Victoire : tenir toutes les vagues du quartier. Défaite : confiance épuisée, ou palais à zéro puis séquence de prise. Si le palais tombe au même moment que la confiance, la prise du palais est prioritaire dans la boucle de vague.

Les étoiles dépendent de la victoire, d’une intégrité du palais d’au moins 65 % et d’une confiance d’au moins 70 %. Les victoires déverrouillent les quartiers suivants et l’XP est cumulée ; le « rang » opérationnel est actuellement calculé à partir de l’index du quartier, pas directement à partir de l’XP. Rejouer peut continuer à donner de l’XP ; cette économie reste rudimentaire.

### 4.2. Carte et quartiers

- Cœur de carte : 19 × 19 cases ; coordonnées étendues de −7 à 25, soit 33 × 33.
- Rues sur les axes x ou y égaux à 3, 9 et 15 ; prolongées vers les approches.
- Quatre portes : nord `(3,-7)`, est `(25,9)`, sud `(9,25)`, ouest `(-7,15)`.
- Palais `(12,12)`, accès de simulation `(15,12)`, 720 points de structure.
- Neuf terrains, identifiants 100 à 108 ; choix du type sur chaque terrain, un exemplaire par type.

| Quartier | Vagues | Effectif de base | Budget initial | Nouveaux profils disponibles |
|---|---:|---:|---:|---|
| Les Lisières | 3 | 24 | 1 000 | Marcheurs, coureurs |
| Les Arcades | 4 | 30 | 1 110 | Groupes déterminés |
| Grand Marché | 4 | 36 | 1 220 | Barricadiers |
| Place Civique | 5 | 42 | 1 330 | Lanceurs |
| Le Bastion | 5 | 50 | 1 440 | Saboteurs |
| Palais d’Azur | 6 | 60 | 1 550 | Tous les profils |

Effectif d’une vague : `base + (numéroDeVague - 1) × 12`, soit jusqu’à 120 sur la dernière configuration. Plusieurs accès s’activent progressivement. Ces valeurs sont un réglage de prototype ; aucune cible de « foule massive » en production n’a été validée.

### 4.3. Constructions

| Identifiant | Construction | Prix | Prérequis construits | Effet |
|---|---|---:|---|---|
| `command` | Poste de commandement | 100 | Aucun | Patrouilles, capacité et niveaux de formation |
| `academy` | Académie | 120 | Commandement | Boucliers, impulsion, formation |
| `workshop` | Chantier | 100 | Commandement | Réparations structurelles et fortifications avancées |
| `depot` | Logistique | 170 | Commandement + chantier | Fourgon à eau, filets |
| `lab` | Centre aérien | 180 | Académie + logistique | Drone niveau 1 ; hélicoptère niveau 2 |
| `civic` | Médiation | 100 | Commandement | Médiateurs, confiance, revenu de 45/niveau/vague |
| `housing` | Habitations | 90 | Commandement | Revenu de 35/niveau/vague |
| `market` | Commerces | 130 | Commandement | Revenu de 65/niveau/vague |
| `clinic` | Secours | 120 | Commandement | Soin des unités terrestres à moins de quatre cases |

Construction : quatre secondes. Amélioration de service : six secondes, maximum niveau 3 ; coût `80 + niveauActuel × 40`. L’amélioration ajoute 80 à la structure maximale et remet la structure à son maximum : ce soin implicite doit être assumé ou revu à l’équilibrage.

Le centre de secours soigne de 4 PV/s/niveau hors vague et de 2 PV/s/niveau pendant les vagues. La médiation restaure également de la confiance dans le temps. Le chantier répare une structure endommagée à la fois en automatique et gère des travaux payants ; les dégâts récents suspendent les travaux sur la cible.

Récompense de vague : `150 + vague × 25 + médiation × 45 + habitations × 35 + commerces × 65`, avec les niveaux des services vivants. Chaque personne dispersée rapporte aussi 3 crédits. Ce dernier mécanisme favorise fortement la dispersion comme source économique : à challenger si le jeu veut aussi valoriser la désescalade et la protection des habitants.

### 4.4. Unités, outils et consignes

| Équipement | Prix | Nature / usage |
|---|---:|---|
| Patrouille | 75 | Un groupe logique, dessiné comme plusieurs agents ; courte portée |
| Boucliers | 100 | Résistant, ligne visuelle, ralentit le contact |
| Barricade | 40 | Obstacle de rue destructible et améliorable |
| Filet | 35 | Zone temporaire de 28 secondes |
| Fourgon à eau | 155 | Action de zone et recul |
| Médiateurs | 85 | Dispersion et confiance |
| Drone | 130 | Aérien, contrôle de petits groupes |
| Impulsion | 40 | Effet immédiat de recul/étourdissement, recharge de huit secondes |
| Hélicoptère | 240 | Aérien, recherche de forte concentration, jusqu’à 18 cibles, ralentissement |

Les groupes sont des entités de simulation uniques, pas quatre ou cinq policiers simulés indépendamment. Les attributs `power`, `hp`, `damage` servent au calcul ; l’habillage parle de pression/dispersion. Aucun système de létalité ou de blessures réalistes n’existe.

Consignes globales : **tenir**, **intercepter**, **repli**. Pas de consignes individuelles persistantes ni d’ordres multi-sélection avancés. Le repli converge vers le voisinage du palais. L’ordre renforcé, disponible au rang 3, multiplie la puissance par 1,6 et dégrade la confiance ; il ne débloque pas des tirs létaux.

### 4.5. Deux systèmes de protection à ne pas confondre

**Barricades de rue :** 180 / 350 / 520 PV selon le niveau. Elles augmentent le coût d’un trajet et peuvent conduire à un détour. Si leur traversée reste retenue, les personnages peuvent les attaquer. Elles ne dessinent pas encore une véritable ligne de barrage continue.

**Protections de façade :** aucune → volets renforcés 120 → grilles 260 → périmètre 440. Prix : 55 / 85 / 115. Le chantier débloque les niveaux avancés. L’armure est consommée avant la structure. Une réparation de façade coûte 30 et rend jusqu’à 160 points ; elle est distincte des travaux structurels. Les services construits sont aussi protégeables.

### 4.6. Comportement de la foule

États : rassemblement, marche, dispersion/départ, suppression. Le groupe d’apparition choisit une cible ; les agents suivent des chemins de rues. Les cibles sont évaluées selon distance, protection, nature du bâtiment et progression, avec variation aléatoire déterministe.

Profils : marcheur, coureur, résistant, constructeur d’obstacles, lanceur et saboteur. Le niveau augmente certaines résistances, vitesses et capacités. Une séparation locale légère évite une superposition totale.

**Ce n’est pas une simulation sociale ou physique de foule.** Les agents n’ont pas de motivations civiles différenciées, pas de recherche d’abri, pas de meneur, pas de mémoire collective, pas de propagation de panique et pas de pression physique résolue. La foule peut donc paraître comme une succession de petites unités malgré le nombre. C’est un chantier de design central.

### 4.7. Séquence du palais

Déclenchement à zéro point de structure. Durée : **4,8 secondes de simulation**, vitesse forcée à 1×. Vue intérieure, bureau, chef d’État, portail et changement de drapeau.

Le moteur crée **48 acteurs de scène supplémentaires**, distincts des agents de la bataille. Ils convergent vers un portail puis vers des positions intérieures. À 2,5 secondes, les 48 sont entrés dans le test. La capture est autorisée à partir de 2,7 secondes avec au moins 12 entrées. Le dirigeant est ensuite escorté dehors. Le bilan apparaît à la fin.

Cette solution a corrigé une vraie lacune visuelle : la foule pénètre désormais dans le bâtiment. **Compromis important :** ce ne sont pas forcément les assaillants présents devant le palais au dernier instant, et la scène ne dépend pas de leur nombre. L’état de la pièce, le parcours et le résultat restent scriptés. Une meilleure continuité est recommandée.

### 4.8. Visuel, audio, contrôles et sauvegarde

Visuel : volumes géométriques isométriques dessinés en code, palette ardoise/bleu/pastel, silhouettes stylisées, effets de débris, eau, filet, secousse et rotor. Pas de sprites de personnages illustrés, d’assets 3D ou de cinématique vidéo.

Audio : Web Audio, partition synthétique à 86 BPM, percussions, basse, nappes mineures et motif épique en tension. Musique et effets séparément désactivables. Activation par interaction utilisateur ; pause et page en arrière-plan coupent la musique. Le test audio valide la programmation et les coupures, pas la qualité du mixage sur téléphone.

Contrôles : glisser/pincer, zoom +/−, sélection d’unités et bâtiments, touches 1–9, P/Espace, Entrée, Échap, vitesse 1×/2×. Palette de constructions défilante sur téléphone. Les menus de pause/aide interrompent le jeu ; les anciens menus d’achat permanents ne constituent pas le modèle retenu.

Sauvegarde : `localStorage`, clé `emmet.city.v1`, enveloppe campagne `v:1`, mission `schema:3`. Autosauvegarde environ toutes les 3,5 secondes et sur plusieurs actions/pauses. Migration des schémas 1 et 2. Les trois anciens bâtiments imposés sont retirés des anciennes missions ; les constructions du joueur sont conservées et les anciennes cibles redirigées. Les sauvegardes v1 reçoivent des services de compatibilité : une vieille partie reprise n’est donc pas identique à une nouvelle partie.

Pas de cloud, de compte de joueur, de synchronisation entre appareils, de garantie de sauvegarde après effacement des données du navigateur, ni d’export/import intégré.

## 5. Reprise technique concrète

### 5.1. Références et accès

- Démo existante : `https://emmet-city.jvlious.chatgpt.site/` ; accès privé propriétaire lors de la dernière publication connue. Claude Code ne doit pas supposer qu’il pourra l’ouvrir sans session.
- Source de travail de la session : `/workspace/sites/emmet-city` ; ce chemin est propre à l’environnement de travail actuel, pas à l’ordinateur du repreneur.
- Identifiant du projet hébergé : `appgprj_6addd9ac11888191aa527ffdf1536a97`.
- Commit de référence : `ee74de4224dca17195c0a50f372d201d2d0a1e60`.
- Version de déploiement connue : `appgdep_6ade494cfdf48191806e0d8a11c1f093`.
- Le paquet `package.json` porte encore `0.1.0` : la révision de produit V03 est affichée ailleurs. Ne pas confondre ces versions.

**Transmission :** fournir à Claude Code ce Markdown **et les sources**. L’URL seule ne donne ni les tests ni le code source de travail. L’archive de sources jointe au débrief contient `web/`, `scripts/`, `tests/`, `docs/`, `README.md`, `package.json`, ce dossier et une référence de baseline ; elle exclut l’historique Git, les secrets et les artefacts de déploiement. Il faudra initialiser ou raccorder un dépôt de destination. Ne pas écraser STREETZ.

### 5.2. Organisation du code

| Fichier | Responsabilité | Point de vigilance |
|---|---|---|
| `web/data.js` | Quartiers, équipements, foule, routes, bâtiments, services | Données mêlées à quelques fonctions ; textes hérités |
| `web/sim.js` | `CityGame`, RNG, chemins, combat, construction, sauvegarde | Classe concentrant beaucoup de règles |
| `web/render.js` | `CityRenderer`, projections, rendu, sélection, animations | Formes et positions codées en dur ; coût par personnage |
| `web/app.js` | DOM, campagne, entrées, boucle, persistance, son | État global de module et forte orchestration UI |
| `web/audio.js` | `AudioFx`, séquenceur et bruitages | Synthèse minimale ; test isolé avec substituts |
| `web/icons.js` | Icônes SVG | Système distinct du Canvas |
| `web/style.css` | Interface et adaptations écran | CSS très compact ; lisibilité et évolution difficiles |
| `web/index.html` | Structure écran, HUD et overlays | Texte statique parfois différent des données réelles |
| `scripts/build.mjs` | Copie `web` vers `dist` et révision `?v=03` | Copie statique ; révision codée en dur et remplacement par regex |
| `tests/sim.test.mjs` | Tests des règles | Très compact ; pas de suite navigateur automatisée persistante |
| `tests/audio.test.mjs` | Test du séquenceur | Pas de test d’écoute ou de rendu audio réel |
| `docs/validation.md` | Vérifications V03 et limites | À maintenir à chaque version |

Pas de dépendances npm déclarées, pas de framework, pas de bundler, pas de backend. Les fichiers ont peu de lignes parce que les méthodes sont souvent écrites en une seule longue ligne : **cela ne veut pas dire que la complexité est faible**. Première amélioration de maintenabilité : formatage stable, sans changement de comportement.

### 5.3. Lancer et tester ailleurs

```sh
cd emmet-city
node --version
npm test
npm run build
python3 -m http.server 8000 --directory dist
```

Ouvrir ensuite `http://localhost:8000`. Un serveur HTTP est nécessaire pour les modules ES ; ne pas ouvrir simplement le fichier HTML en `file://`. Les commandes supposent Node, npm et Python disponibles. Aucune version minimale Node n’est déclarée : choisir une version maintenue supportant `node:test` et `structuredClone`, puis la fixer dans le projet/CI. Les outils de prévisualisation du présent hébergement ne sont pas nécessaires à Claude Code.

`dist/` est généré ; modifier `web/` et les sources du build. Pour une nouvelle livraison, synchroniser les révisions affichées et les URLs de cache. Conserver une sauvegarde de test et identifier visiblement la version pour éviter un nouveau retour « je ne vois pas la modification ».

### 5.4. Architecture et points à conserver

La simulation est séparée du rendu et importable en Node. Le générateur pseudo-aléatoire est explicite et sauvegardé. La boucle navigateur utilise un pas fixe de 1/30 s avec accumulateur, un delta plafonné et au plus huit pas par image. La simulation plafonne aussi ses deltas à 0,05 s.

Les chemins utilisent un parcours pondéré de type Dijkstra avec tri du tableau ouvert ; obstacles et barricades ajoutent des coûts. Le cache de chemins est vidé quand la topologie change. Les avions passent par un déplacement direct simplifié, sans même réseau de routes, mais leur destination UI doit actuellement être une rue.

Le terrain statique est dessiné dans un canvas hors écran puis réutilisé tant que la caméra ne change pas. Le DPR est plafonné à 2. C’est une base raisonnable à mesurer avant d’envisager une réécriture de moteur.

## 6. Audit de direction technique

### 6.1. Ce qui est sain

Séparation initiale règles/rendu ; tests exécutables sans navigateur ; RNG sérialisé ; sauvegardes versionnées ; faible surface de dépendances ; build simple ; premier cache de terrain ; périmètre solo qui permet d’itérer vite. La V03 a également corrigé des écarts structurels plutôt que seulement changer le texte : vrai départ à un palais, services utiles, façades séparées, entrée intérieure du palais.

### 6.2. Défauts et risques concrets

| ID | Statut | Observation et conséquence | Action recommandée |
|---|---|---|---|
| T01 | Reproduit par appel moteur | `canPlace('build:command',9,9)` renvoie `null` = valide, alors que `buildService` au même point échoue : validation de survol différente de la pose | Une fonction commune valide type, dépendances **et terrain** ; même motif d’erreur partout |
| T02 | Reproduit par appel moteur | Un saboteur à `(9,9)` réduit un hélicoptère à la même coordonnée de 210 à 192 PV ; son ciblage ne filtre pas l’aérien | Définir explicitement les couches de cibles et permissions de chaque attaque |
| T03 | Inspection ; saturation non reproduite en partie ordinaire | À 420 agents, `spawn()` ne crée rien, mais l’appelant incrémente `spawned` malgré tout | Retour de succès explicite ; une apparition refusée reste en attente ; test de conservation des effectifs |
| T04 | Inspection | Par unité : filtrage puis tri de la foule ; hélicoptère : recomptage des voisins pour chaque candidat, coût quadratique | Index spatial partagé, cellules de densité, cibles réévaluées à fréquence réduite ; profiler avant/après |
| T05 | Inspection | Cache de chemins sans taille maximale ; copies de chemins et allocations répétées | Mesurer taille et allocations ; borner/cache par graphe et destination selon profil |
| T06 | Inspection | Validation de sauvegarde partielle ; peu de contrôles profonds des services, chemins, acteurs de scène, nombres et dépendances | Validation de schéma et invariants après migration ; fichiers invalides rejetés proprement |
| T07 | Inspection | Même RNG utilisé par `fxSparingly` et par les règles ; changer une fréquence d’effet peut changer les futurs tirages de gameplay | Séparer RNG de simulation et RNG visuel ; préserver la reproductibilité |
| T08 | Inspection | Budget dépensé non compté uniformément dans `stats.spent` : plusieurs réparations/améliorations débitent sans mise à jour | Centraliser transactions et motifs ; utile avant tout audit économique |
| T09 | Inspection | Terrain mis en cache avec une clé de caméra, sans identifiant de carte/contenu | Ajouter une révision de terrain lors de l’introduction de cartes différentes |
| T10 | Inspection | Code compact, grande classe, chaînes HTML et coordonnées directement dans les méthodes | Formater puis extraire progressivement ; éviter une réécriture globale sans tests |
| T11 | Inspection | Rattrapage plafonné à huit pas/image ; pas de métrique de retard de simulation | Mesurer accumulation, vitesse effective à 2× et durée réelle des séquences sous charge |
| T12 | Inspection | Quelques textes de quartier visent encore halles/maison civique, alors que `buildings(level)` crée toujours le palais ; bilan « ville préservée » = palais seul | Unifier modèle de mission, objectifs affichés et métriques réelles |

T03 est une fragilité future, pas la preuve d’une vague actuellement bloquée : les vagues configurées culminent à 120 et sont espacées. L’ancien retour « plus d’assaillants à la troisième vague » ne suffit pas à identifier la même cause.

T06 n’est pas présenté comme une faille distante : les données sont aujourd’hui locales. C’est d’abord un risque de reprise cassée, de test incomplet et de futures importations non fiables.

### 6.3. Choix technologique recommandé

**Conserver la base Web pour la prochaine tranche jouable**, en restructurant et profilant. La promesse de foule ne nécessite pas automatiquement de la 3D. Il faut d’abord décider du format de parties, du nombre d’agents simultanés et du rendu réellement souhaité.

La documentation MDN recommande de précalculer les primitives répétées et de séparer les couches de scène : cela conforte le cache déjà présent et une extension mesurée aux silhouettes répétées. Source : [Optimizing canvas, MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), consultée le 26/10/2026.

Si l’objectif devient un jeu natif avec animation d’équipe, outils de niveau et production artistique plus lourde, comparer un moteur dédié à partir d’une **même scène de charge**. Godot est un candidat d’étude, pas une décision prise. Sa documentation Web détaille des contraintes de rendu, de threads et de performances mobiles : changer de moteur ne supprime pas les contraintes navigateur. Source : [Exporting for the Web, documentation Godot](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), consultée le 26/10/2026.

Ne pas engager le multijoueur avant d’avoir un gameplay solo stable. S’il devient prioritaire : conception serveur autoritaire, validation des commandes, budget réseau, reconnexion et outils de diagnostic constituent un chantier distinct. Aucune de ces briques n’existe ici.

## 7. Audit game design et développement gameplay

### 7.1. La promesse la plus forte

La différence intéressante se situe dans **une ville que l’on construit et dont les voies deviennent un problème tactique mouvant**. Une foule qui converge, se divise et contourne doit transformer la lecture des rues ; construire doit changer les options, pas seulement remplir une grille de déblocage.

Le palais fournit une condition de défaite spectaculaire et immédiatement compréhensible. Le chantier et la médiation permettent de sortir du simple « plus de dégâts ». Ces systèmes méritent plus de profondeur avant d’ajouter quinze équipements supplémentaires.

### 7.2. Risques de design actuels

- **Courbe de puissance trop rapide :** un budget de départ élevé et des constructions de quatre secondes permettent de sauter vite l’étape « petit service ». Construire devient une séquence d’achats, pas forcément une progression satisfaisante.
- **Missions trop similaires :** mêmes routes et objectif central ; la difficulté augmente surtout par le volume et les profils. Des noms différents ne créent pas une nouvelle situation tactique.
- **Économie peu incarnée :** logements et commerces versent de l’argent par vague sans vraie activité civile. Le joueur peut les lire comme des bonus abstraits.
- **Confiance trop simple :** une jauge qui monte avec un service et baisse avec une option peut devenir une taxe de DPS. Elle ne traduit pas encore les conséquences politiques et sociales évoquées dans la vision.
- **Casse perçue vs calcul :** les dégâts continus ne correspondent pas toujours au rythme des coups visibles. Une animation plus énergique seule ne résoudra pas cet écart.
- **Foule homogénéisée :** toutes les personnes sont dans une boucle d’attaque/dispersion. Le jeu ne distingue pas des habitants, manifestants pacifiques, opportunistes et groupes destructeurs.
- **Construction contrainte :** neuf cases et neuf types conduisent à terme à la même collection ; le choix d’implantation doit produire des effets observables pour créer de la rejouabilité.
- **Anticipation incomplète :** plus loin n’aide que si la direction, la composition et l’heure du contact sont visibles.

### 7.3. Recommandation de mission de référence

**Proposition à valider :** une mission de huit à douze minutes, trois vagues très différenciées, deux ou trois accès initiaux, un palais, quelques commerces à construire/protéger et six constructions accessibles progressivement. Pas d’ajout online dans cette tranche.

La première vague apprend le placement et la distance. La deuxième force une bifurcation et un arbitrage réparation/renfort. La troisième combine deux fronts et rend le soutien aérien utile sans en faire une réponse universelle. Prévoir plusieurs stratégies victorieuses et une défaite lisible, avec un bilan expliquant précisément les causes.

Premiers mécanismes à expérimenter :

1. **Groupes et intentions visibles.** Chaque groupe possède une direction, une cohésion et un objectif ; les silhouettes gardent de la variété. Signaler les sous-groupes destructeurs sans assimiler toute la population à une cible hostile.
2. **Télégraphie.** Indicateurs en bord de carte, silhouettes aux portes, estimation du temps avant contact et aperçu des accès avant la vague.
3. **Barrages en segments.** Prévisualiser une courte ligne raccordée et son coût, les passages laissés ouverts et les itinéraires probables. Le choix doit être lisible avant la dépense.
4. **Impacts cohérents.** État préparation → frappe → récupération ; dégâts et événement visuel déclenchés ensemble. Donner une silhouette différente à chaque rôle avant de multiplier les particules.
5. **Bâtisseurs visibles.** Une petite équipe affectée à un bâtiment, progression du chantier et motif d’arrêt clair. Un réseau complet de logistique est une étape ultérieure.
6. **Confiance utile.** Tester des objectifs de protection civile ou de continuité des services ; récompenser l’évitement des dégâts et la désescalade, sans transformer cela en menu administratif.
7. **Continuité du palais.** Utiliser ou dériver les derniers groupes présents pour la scène finale ; garder son format court, ses entrées intérieures et son issue visible.

Les mécaniques restent abstraites et fictionnelles. Le jeu doit enseigner ses propres règles ; ne pas le présenter comme une méthode réelle de maintien de l’ordre, d’insurrection ou de blocus.

## 8. Audit visuel, animation, son et UX mobile

### Direction artistique

Le rendu actuel fonctionne comme une maquette jouable cohérente : volumes simples, lumière lisible, contraste entre unités bleues et foule chaude, protections dorées, interface sombre. Il est économique à produire et permet des modifications rapides.

Il reste éloigné d’un niveau artistique final distinctif. Le nombre de petits personnages ne suffit pas à créer l’échelle ; l’absence de vie civile et la grille très régulière rendent la ville abstraite. Le palais au milieu d’un terrain encore vide peut ressembler à une base isolée plutôt qu’à une capitale fragilisée.

**Recommandation :** conserver une vue isométrique lisible et choisir une direction urbaine stylisée assumée. Travailler une planche de référence avec formes, architecture fictive, silhouettes, éclairage, interface et animation. Développer un quartier témoin complet avant de décliner six environnements. Le réalisme photographique et la surenchère d’effets ne sont pas requis.

### Priorités d’animation

Faire lire au zoom de jeu : arrivée → rassemblement → mouvement de groupe → contact → impact → dommage → recul/départ. Distinguer chaque étape par mouvement et son, pas seulement par couleur. Ajouter des débris persistants limités, poussière courte et façade dégradée ; réserver les gros effets aux événements majeurs.

L’hélicoptère doit avoir une entrée identifiable, une ombre cohérente, une zone d’intervention lisible et un coût d’opportunité. L’effet de foule devrait venir d’une coordination à l’échelle des groupes, et non du seul grossissement des personnages.

### UX et accessibilité

Au premier lancement, faire construire un commandement puis une défense en contexte. Montrer ce qui vient d’être débloqué et pourquoi. Limiter les interruptions pendant l’action. Une carte verrouillée doit expliquer son rôle et son prérequis, sans paraître utilisable immédiatement.

À tester sur appareils physiques : sélection au doigt dans les zones denses, chevauchement des panneaux, palette cachée par le pouce, différence glisser/sélectionner, pincement, rotation, zone sûre, texte, mise en arrière-plan et reprise audio. Prévoir tailles tactiles confortables, motifs/icônes en plus des couleurs et option de réduction des secousses/effets.

### Audio

Conserver la direction hip-hop/épique, mais prévoir un vrai travail de mixage : signature musicale, tension en couches, interventions différenciées, impacts nets sans saturation et ambiance de ville. Le rap vocal est un choix créatif et de production distinct ; il n’a pas été livré. Évaluer lisibilité et fatigue à faible volume sur haut-parleur de téléphone.

## 9. Audit QA : ce qui est prouvé et ce qui ne l’est pas

### 9.1. Vérification effectuée pour ce rapport

`npm test` relancé sur le commit de référence : **16 tests passent, zéro échec**. Inspection des sources, du build, de la documentation et reproductions ciblées T01/T02. Aucun changement de gameplay et aucun nouveau déploiement n’ont été effectués pour produire ce rapport.

Couverture des tests existants :

1. Programmation du séquenceur et coupures pause/musique.
2. Un palais, neuf terrains vides et zéro troupe sur les six configurations.
3. Coût, emplacement, délai et déblocage de construction.
4. Fonctions des neuf services et revenus.
5. Soins terrestres à portée.
6. Hélicoptère : prérequis, action et déplacement aérien.
7. Façades : absorption, réparation distincte et niveaux.
8. Protection, destruction et reconstruction de services.
9. Réparations suspendues sous attaque.
10. États de frappe, dégâts, particules et secousses.
11. États d’intervention et de déplacement.
12. Approches plus longues et détours.
13. Palais vivant sous 25 %, déclenchement à zéro, entrée/capture/sortie.
14. Sauvegarde/reprise et rejet de positions invalides.
15. Migration v2 et suppression des bâtiments imposés.
16. Victoire des trois vagues du premier quartier avec une stratégie ordinaire : 108 dispersions.

### 9.2. Validation navigateur antérieure consignée

La V03 a été observée dans le vrai moteur : départ, sélection du palais, pose d’une façade, construction et scène complète de prise. Un banc local utilisant les mêmes modules a servi à inspecter l’intérieur à des moments fixes et une intervention avec hélicoptère. Formats 390 × 844 et 844 × 390 contrôlés dans un iframe du jeu. Captures dans `docs/images/`. Le banc temporaire n’est pas livré comme test automatisé réutilisable.

**Limites :** un iframe n’est pas une certification iPhone/Android ; les captures ne démontrent pas le framerate ; le test de victoire ne couvre pas les six quartiers ; les tests de règles ne démontrent pas le plaisir de jeu, l’absence de défaut visuel ou la qualité sonore.

### 9.3. Plan QA recommandé

| Bloc | Scénarios prioritaires | Résultat attendu |
|---|---|---|
| Départ | Nouvelle partie sur chacun des six quartiers | Toujours un palais seul ; fonctions et prochains choix compréhensibles |
| Placement | Routes, terrains, ruines, fonds insuffisants, carte verrouillée | Prévisualisation identique au résultat ; aucun débit sur échec |
| Économie | Construire, améliorer, réparer, détruire, reconstruire | Aucune double dépense ; gains et statistiques exacts |
| Vagues | Plusieurs graines, toutes les vagues, tous les accès | Aucun groupe perdu, compteur bloqué ou fin prématurée |
| Navigation | Routes fermées, obstacles ajoutés/détruits, unités aériennes | Pas d’immobilisation inexpliquée ; permissions cohérentes |
| Sauvegarde | Chaque phase, chantier, façade détruite, prise du palais | Reprise cohérente ; migration stable et rejets lisibles |
| Temps | Pause, 2×, arrière-plan, appareil lent | Pas d’action pendant pause ; pas de saut ou retard incontrôlé |
| Mobile | Safari iOS et Chrome Android sur appareils physiques | Gestes, rotation, son, tailles et lisibilité acceptables |
| Charge | 120, puis 250 et 400 agents, plusieurs hélicos | Mesures CPU/frame, mémoire et retard, sans prétendre ces seuils supportés avant test |
| Expérience | Joueurs nouveaux, sans explication orale | Comprennent quoi bâtir, pourquoi ils perdent et comment changer leur plan |

Pour la simulation : tester plusieurs graines et des invariants de conservation plutôt qu’un seul déroulé scripté. Enregistrer un état minimal lors d’un blocage. Ajouter un détecteur de stagnation pour diagnostic, sans effacer artificiellement les adversaires afin de masquer le problème.

**Cibles proposées, non mesurées :** 60 images/s visées sur appareil intermédiaire, 30 minimum dans le mode qualité réduit ; mesurer les temps de frame médians et p95, le temps de simulation et la mémoire. Fixer les appareils de référence avant d’en faire des engagements. Ne pas instrumenter des données personnelles : un journal local exportable suffit au prototype.

## 10. Audit marketing et positionnement

Cette section est une analyse de proposition de valeur. **Aucune étude concurrentielle exhaustive, estimation de marché, mesure de rétention, test publicitaire ou validation de rentabilité n’a été réalisée.** Ne pas affirmer que le concept n’existe nulle part, qu’il sera viral ou qu’il est commercialement validé.

### Proposition de valeur recommandée

« Rebâtissez une capitale fragile, préparez vos services et adaptez vos défenses aux mouvements d’une foule qui transforme la ville. »

Ce positionnement valorise la construction et la lecture tactique, en accord avec les dernières demandes. Un simple slogan « contrôlez l’émeute » décrit une action mais raconte moins le projet de reconstruction.

**Public à tester :** amateurs de défense par vagues, de stratégie accessible et de construction compacte. Ce sont des hypothèses de cible, pas des segments déjà démontrés. Les sessions courtes et la lisibilité mobile sont à valider ; le format actuel n’a pas été chronométré systématiquement.

### Atouts potentiels

- Une image de ville, de foule et d’interventions immédiatement montrable.
- Des choix de construction plus incarnés que des tours génériques.
- Une fin de mission mémorable autour du palais.
- Une direction musicale urbaine cohérente avec la personnalité recherchée.

### Risques de compréhension

Le jeu peut être perçu soit comme un simulateur policier, soit comme une satire politique, soit comme un city builder. Il faut choisir un contrat de jeu clair. Si toutes les personnes visibles attaquent, le jeu raconte implicitement une population uniformément ennemie, ce qui s’éloigne de l’ambition de restaurer un pays et de préserver la confiance.

Proposition : pays et symboles fictifs, personnages différenciés, objectifs de protection civile et conséquences mécaniques. La fiction seule ne suffit pas si le système récompense exclusivement la force. La scène de capture présidentielle peut rester un enjeu spectaculaire, sans exécution ni référence directe à un dirigeant réel.

### Validation marketing recommandée

Montrer une séquence réelle de vingt à trente secondes : construire → voir converger une foule → modifier une défense → constater la conséquence. Tester deux formulations du concept et demander aux joueurs de décrire le jeu avec leurs mots. Observer ce qu’ils veulent rejouer et ce qu’ils ont compris du rôle des bâtiments.

Mesurer d’abord première construction, premier lancement, première défaite comprise, fin de mission et relance volontaire. Aucun objectif chiffré de conversion ou de rétention ne doit être inventé à ce stade. Monétisation, publicité et boutique restent non décidées. Ne pas compromettre les tests de plaisir par des contraintes commerciales prématurées.

## 11. Feuille de route proposée avec critères de sortie

L’ordre est recommandé ; ce n’est pas un engagement de délai. Estimer après avoir choisi l’ambition visuelle, les plateformes et le nombre de développeurs.

### P0 — Baseline fiable et état connu

- Importer les sources dans un dépôt dédié, conserver la référence V03 et les sauvegardes de test.
- Formater sans modifier les règles ; documenter les commandes et fixer l’environnement Node.
- Corriger T01/T02 ; ajouter les tests ciblés et l’invariant de comptage d’apparitions T03.
- Aligner textes, indicateurs et objectifs avec le palais et les bâtiments réellement présents.
- Préserver les migrations et les 16 tests existants.

**Sortie :** installation reproductible ; tests verts ; placement fidèle à son aperçu ; permissions aériennes explicites ; aucun effectif perdu silencieusement ; nouvelle partie toujours à un palais.

### P1 — Mission de référence et profondeur de construction

- Une carte conçue pour les choix, pas seulement une grille.
- Un tutoriel intégré et bref ; fonctions démontrées après chaque construction.
- Un rythme budgétaire qui donne du poids aux constructions.
- Barrages raccordables et aperçu des flux.
- Deux stratégies viables documentées sur la même mission.

**Sortie :** des joueurs nouveaux comprennent le premier choix et la raison d’une défaite ; les changements de plan produisent un résultat perceptible ; aucun menu persistant ne masque l’action.

### P2 — Foule, interventions et palais

- Groupes avec cohésion, bifurcation et priorités visibles.
- Synchronisation des coups et des dégâts ; état de destruction progressif.
- Identité des unités lisible sans zoom extrême.
- Hélicoptère utile mais pas universel ; continuité de la foule dans la prise du palais.

**Sortie :** le joueur identifie arrivée, regroupement, contact et rupture ; il distingue un groupe dangereux et sait quelle réponse du jeu essayer ; la capture reste courte et se déroule à l’intérieur.

### P3 — Performance, qualité et campagne

- Profilage sur appareils physiques ; index spatial et optimisation des points coûteux prouvés.
- Tests de vagues multi-graines, reprises et charge prolongée.
- Décliner des cartes et objectifs réellement différents après validation de la mission témoin.
- Finitions audio, accessibilité et réglages de qualité.

**Sortie :** budgets de performance documentés ; pas de blocage dans les scénarios de campagne retenus ; différences tactiques entre missions démontrées ; migration d’une version à l’autre testée.

### P4 — Extensions à arbitrer

Mode foule, coopération, duel asymétrique, gestion persistante du pays, construction libre, export natif, clans, équipements récupérables et séquences de contrôle direct sont des chantiers possibles. Ils ne doivent pas tous être entassés dans le même MVP. STREETZ peut garder la vision monde ouvert/récupération/QG ; EMMET peut garder sa propre identité de stratégie.

## 12. Arbitrages encore ouverts

| Question | État actuel | Recommandation de travail |
|---|---|---|
| Quelle promesse domine ? | Défendre le palais et bâtir des services | Construction tactique et ville sous pression ; maintenir un objectif décisif lisible |
| Une capitale existante ou un pays naissant ? | Palais seul dans une grille vide | Choisir une justification narrative et visuelle ; éviter la contradiction entre discours et départ |
| Pays persistant ou missions réinitialisées ? | Missions réinitialisées ; progression XP/étoiles | Stabiliser les missions avant une économie persistante |
| Foule entière hostile ou rôles civils ? | Foule entière dans la boucle de combat | Différencier intentions et objectifs ; tester sans surcharger l’interface |
| Orientation mobile ? | Portrait et paysage pris en charge sommairement | Choisir un format prioritaire après essais de lisibilité ; garder l’autre fonctionnel |
| Réalisme ou stylisation ? | Stylisation géométrique | Stylisation urbaine lisible ; niveau de finition à hausser |
| Construction libre ? | Neuf terrains fixes | Prouver d’abord les choix d’emplacement ; ouvrir davantage si nécessaire |
| Deux rôles ? | Défense uniquement | Concevoir une vraie boucle distincte avant de promettre le second |
| Online ? | Rien d’implémenté | Reporter tant que la mission solo n’est pas convaincante |
| Jeu politique, satirique ou stratégie fictive ? | Ambiguïté encore possible | Écrire une courte intention éditoriale cohérente avec les règles |

## 13. Brief prêt à transmettre à Claude Code

Copier ce bloc dans Claude Code et joindre le dossier complet ainsi que l’archive de sources :

```text
Tu reprends EMMET, jeu autonome de construction et de défense urbaine par vagues,
distinct de STREETZ. Lis EMMET_DOSSIER_REPRISE_CLAUDE_CODE.md et les sources avant
de proposer une architecture ou une réécriture.

Le prototype de référence est la V03 Fondations, commit d'origine
ee74de4224dca17195c0a50f372d201d2d0a1e60. Il n'est pas la vision finale.

Vision récente du créateur : partir avec un seul bâtiment, construire un petit
service puis des institutions, voir arriver une foule de loin, organiser des
défenses dans les rues, protéger/réparer les bâtiments, débloquer des unités,
des drones et hélicoptères. Les adversaires doivent devenir plus intéressants
collectivement. Le palais présidentiel est un objectif décisif. Sa chute donne
une scène de 3 à 5 secondes où la foule entre réellement, capture le dirigeant
et le fait sortir. Musique urbaine hip-hop avec tension épique.

État réel : solo Web, JS natif, Canvas2D isométrique, aucun backend, neuf terrains
fixes, neuf services, six difficultés sur la même géométrie, règles de foule
simples, sauvegardes locales schema 3. Les 16 tests passent à la baseline.
Le palais commence seul, sans troupe. Ne pas réintroduire les bâtiments imposés.
Le monde ouvert GTA, les clans et le loot sont l'historique STREETZ, pas une liste
de fonctionnalités déjà acquises ou nécessairement prioritaires pour EMMET.

Mission initiale :
1. Reproduire l'exécution et les tests ; inspecter le jeu réel.
2. Vérifier les constats du rapport, notamment aperçu de construction incohérent
   et sabotage d'unités aériennes. Séparer bugs reproduits, risques et préférences.
3. Proposer une vision produit courte et une mission de référence convaincante.
4. Présenter le plan priorisé et ses compromis avant tout changement de périmètre
   majeur ; avancer sur les corrections réversibles et clairement nécessaires.
5. Implémenter par étapes, préserver les sauvegardes, tester les effets visibles
   et documenter les limites. Ne pas remplacer une preuve visuelle par un texte.

Privilégie : plaisir de construire, lecture de foule, anticipation, impacts
visibles, barricades utiles, choix réels et conséquences compréhensibles.
Apporte ta propre analyse. Tu peux contester les compromis du prototype avec
des raisons et une expérience de validation ; ne les traite pas comme intouchables.

Livrables attendus : audit vérifié, proposition de design, backlog avec critères
d'acceptation, changements testés et démonstration jouable de la mission témoin.
Ne prétends pas avoir validé toute la campagne ou les performances mobiles si
tu n'as testé que les trois premières vagues ou une fenêtre de navigateur.
```

## 14. Traçabilité et limites du présent audit

Sources internes relues : `README.md`, `docs/validation.md`, `package.json`, `scripts/build.mjs`, `web/data.js`, `web/sim.js`, `web/app.js`, les parties structurantes de `web/render.js`, `web/audio.js`, `web/index.html` et les deux fichiers de tests. Référence Git contrôlée ; dépôt propre au moment de la lecture. Les images de validation restent des preuves de rendu à un instant, pas des mesures de qualité ou de performance.

Les intentions et l’historique sont reconstruits à partir des messages du créateur visibles dans la conversation. Les affirmations d’implémentation portent sur **EMMET V03**, pas sur le dépôt STREETZ. Les recommandations de produit et de marketing sont des jugements argumentés, pas des résultats d’études utilisateurs ou de marché. Les propositions de moteurs et de performance sont des options à évaluer, pas des migrations déjà décidées.

**Décision de direction proposée :** préserver la liberté et l’ambition du projet, tout en concentrant la prochaine itération sur une ville que l’on comprend, une construction qui change le jeu et une foule dont les mouvements créent de vraies décisions. C’est cette preuve jouable qui doit guider la suite.
