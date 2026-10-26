# Validation — V05 · Interpellations et nouvel arsenal

26 octobre 2026. 34 tests Node passent.

| Livré | Preuve |
| --- | --- |
| Interpellations : une personne maîtrisée au contact (patrouille, boucliers) ou marquée par un drone s'assoit et attend. Dès 3 personnes (ou 6 s d'attente), un fourgon part du commandement, embarque jusqu'à 6 personnes proches et repart. +4 crédits par personne livrée. Fourgons simultanés : 1 + niveau du commandement. Personne ne vient en 30 s → elle repart. | Tests (cycle complet, paiement, abandon). Navigateur : 12 interpellations livrées en une vague, capture `docs/images/v05-interpellations.jpg`. |
| Eau, médiation, filets : dispersion (la personne rentre chez elle), sans prime | Test. |
| Fumigène (Logistique, 45) : ferme une rue 20 s dans la carte de flux, la foule contourne | Test : détour pendant, chemin d'origine après. |
| Camion sono (Médiation, 90) : leurre 30 s qui attire les groupes à 6 cases ; sa destruction ne coûte pas de confiance | Test. |
| Hélicoptère : projecteur qui neutralise lanceurs, saboteurs et barricadiers ; largue un filet toutes les 10 s sur la plus forte concentration. Recherche de densité en une passe (était quadratique). | Test. |
| Drone : marque ses cibles (point violet) ; maîtrisées, elles sont interpellées | Test. |
| Vagues 3-4 : prime de fin de vague 150 + 40 × vague (au lieu de 25) | Stratégie automatique : quartiers 2 à 4 gagnés sur la plupart des graines ; 5 et 6 restent durs. Mission témoin : `lines` 3★, `fortress` 2★, `passive` perd. |

---

# Validation — V04 · Mission témoin

26 octobre 2026. 28 tests Node passent.

| Livré | Preuve |
| --- | --- |
| Mission témoin (Les Lisières) : 320 crédits, vagues écrites à la main (1 rue → bifurcation → 2 fronts) | Test : `lines` (barrages en avant, 3★) et `fortress` (défense au palais, 2★) gagnent, `passive` perd, sur 3 graines. |
| Économie serrée : revenus continus en vague et en accalmie, aucun revenu en préparation, plus de prime par dispersion | Test : impossible de bâtir plus de 3 services avant la vague 1 ; 60 s d'attente ne rapportent rien. |
| Vagues annoncées : effectif par porte avant le lancement ; trajet, cible et temps de contact pendant le rassemblement | Test : la vague annoncée est la vague jouée. Capture `docs/images/v04-mission-temoin.jpg`. |
| Foule sur cartes de flux (un calcul par destination au lieu d'un par personne) | Test : longueurs identiques à l'ancien routage optimal, détour autour des barrages. |
| Bâtisseurs : restauration d'une ruine (type et niveau) à moitié prix | Test et capture du bouton RESTAURER. |
| Bilan : causes (porte la plus dangereuse, services perdus, confiance) | Test (toute défaite a une cause) et capture. |
| Gel n°1 corrigé (hérité du V03) : des personnes se bousculant sur un point de passage ne l'atteignaient jamais, la vague ne finissait pas | Test dédié + test de fumée : les 6 quartiers se terminent. |
| Gel n°2 corrigé (hérité du V03) : commandement détruit → plus aucune vague ne pouvait démarrer | Test dédié. |
| Amélioration de service : plus de soin complet caché (+80 de structure seulement) | Test. |

Équilibrage : la mission témoin est réglée. Les quartiers 2 à 6 sont grossièrement rééquilibrés (budgets et premières vagues réduits, puis croissance plus forte) : une stratégie automatique simple atteint au moins la vague 2 partout et gagne parfois. Ils n'ont pas été réglés à la main.

Navigateur : Chromium 390 × 844 tactile, du départ au bilan, sans erreur console. Pas d'appareil physique.

---

# Validation — Prototype 03.1 · Fondations (P0)

26 octobre 2026. Reprise du V03 : vingt tests Node passent (16 d'origine + 4 régressions).

| Constat de l'audit | Correction | Preuve |
| --- | --- | --- |
| T01 · aperçu de construction vert sur une rue, pose refusée | `buildPlot()` unique, utilisé par l'aperçu (`canPlace`/`canBuild` avec coordonnées) et par `buildService`. L'aperçu surligne le terrain réellement visé. | Test T01 (échoue sur V03) ; navigateur : rue (15,15) en rouge, terrain (6,6) surligné en vert, clic → commandement bâti. |
| T02 · un saboteur au sol endommage un hélicoptère | `airborne(u)` : contact, pierres et sabotage ne visent que les unités au sol. | Test T02 (échoue sur V03) ; une patrouille reste sabotable. |
| T03 · apparition refusée par le plafond de 420 comptée quand même | `spawn()` renvoie `false` ; l'apparition reste en attente. | Test T03 : 10 s de saturation, aucun effectif perdu. |
| T08 · `stats.spent` incomplet | Toute dépense passe par `spend()`. | Test T08 sur 11 types de transactions. |
| T12 · textes de quartier visant des bâtiments absents | Objectifs réécrits, champ `primary` inutilisé supprimé, bilan « PALAIS PRÉSERVÉ ». | Relecture. |

Non-régression : une empreinte de 18 parties scriptées (6 quartiers × 3 graines, instantanés hachés) est identique avant/après le formatage et les corrections. Navigateur Chromium (Playwright, 1280 × 800 et 390 × 844 tactile) : départ, construction, vague, prise du palais (48/48 entrés) et bilan, sans erreur console. Ce n'est pas une certification sur appareil physique.

Captures : `docs/images/prototype03.1-t01-preview.jpg` (aperçu rouge sur une rue / terrain surligné) et `docs/images/prototype03.1-mobile.jpg` (accueil, vague, intérieur du palais à 390 × 844).

Révision affichée et cache des modules : `REVISION` dans `web/data.js` (accueil, HUD, `?v=` du build).

---

# Validation — Prototype 03 · Fondations

25 octobre 2026. Seize tests natifs Node passent.

## Corrections demandées et vérification

| Demande | Résultat vérifié |
| --- | --- |
| Commencer avec un bâtiment | Une unique entrée dans `buildings`, le palais, aucune troupe et neuf terrains vides, sur les six quartiers. Vérification visuelle de l'écran initial. |
| Construire et comprendre les bâtiments | Neuf types aux fonctions affichées. Recrutement après construction, revenus réels des logements/commerces et soins effectifs du centre de secours. |
| Barricader les immeubles | Trois réserves de façade, 120/260/440, consommées avant la structure. Réparation distincte, conditions du chantier, protections applicables aux services. |
| Rendre la casse visible | État de frappe et cible orientée, dégâts réels, éclats, secousses du bâtiment et protections cassées. |
| Dynamiser les unités | États de déplacement et d'intervention, formations, poses des agents, recul et effets propres à chaque équipement. |
| Introduire l'hélicoptère | Déblocage au centre aérien niveau 2, déplacement aérien, pression et ralentissement sur dix-huit cibles dans le test de densité. Rendu du rotor, ombre et projecteur contrôlé dans une scène jouant le même moteur. |
| Entrer dans le palais | À 2,5 secondes, les 48 acteurs sont au-delà du seuil intérieur. Le chef est capturé après l'entrée, puis son trajet traverse le portail vers l'extérieur. Défaite après 4,8 secondes. |
| Garder les acquis | Sauvegarde des travaux, armures, unités aériennes et séquence intérieure. Migration des services v2 ; suppression des trois immeubles imposés ; redirection des anciennes cibles. |
| Préserver le gameplay | Une stratégie avec le budget initial et les revenus normaux contient les trois premières vagues et disperse 108 personnes. |
| Musique | Séquenceur original conservé, programmation des couches et coupures testées. |

## Navigateur

Rendu Canvas réel utilisé pour vérifier le départ, le rôle du palais, la pose de volets et la construction sur un ancien emplacement d'immeuble. Un banc local utilise directement les modules du moteur pour lire la séquence complète, inspecter l'intérieur à des étapes fixes et observer une intervention avec hélicoptère et foule évoluée. Il est exclu de l'archive livrée. Les captures documentent le moteur réel ; elles ne sont pas des images générées.

Les formats 390 × 844 et 844 × 390 ont été contrôlés dans un iframe du vrai jeu : défilement vers les habitations et affichage de leurs revenus, sélection du palais et pose de volets depuis le panneau de protection. La séquence complète a été lue jusqu’au message de renversement du régime.

La mise en cache du terrain évite de redessiner les centaines de cases et les arbres à chaque image ; seuls les éléments animés sont redessinés tant que la caméra ne change pas. Ce changement améliore le travail de rendu sans modifier les règles. Il ne constitue pas une mesure certifiée des performances sur tous les téléphones.

## Limites

Construction sur neuf emplacements, un exemplaire par type, jeu solo et données locales. La musique est instrumentale. Aucune simulation d'armes létales. La difficulté avancée n'est pas certifiée par un parcours de victoire sur les six niveaux : la validation de victoire se concentre sur le départ et les trois premières vagues.
