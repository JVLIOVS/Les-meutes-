# EMMET — Proposition V04 « Mission témoin »

26 octobre 2026 · rédigée après la reprise P0 (révision 03.1). À valider par le créateur avant tout changement de périmètre.

Statuts : **Mesuré** (chiffre obtenu en exécutant le moteur), **Proposé** (à décider), **Hors périmètre** (rien de prévu dans cette tranche).

## 1. Ce que la reprise a établi

| Constat | Statut | Conséquence |
| --- | --- | --- |
| Le budget de départ couvre 90 % du coût des neuf services au quartier 1 (1 000 / 1 110) et 100 % ou plus dès le quartier 2. | Mesuré | « Partir de rien » dure une minute de clics : la construction est un achat, pas une progression. |
| Contact avec un bâtiment environ 12,5 s après le lancement d'une vague (5 s de rassemblement, ~7,5 s de marche), quel que soit le quartier. | Mesuré | Les approches « de loin » donnent 12 s de lecture, et l'accalmie de 18 s relance la vague suivante automatiquement. |
| Un palais sans défense tombe en 59 s (quartier 1) à 36 s (quartier 6). | Mesuré | La pression est réelle. Le problème, c'est la variété des situations, pas la difficulté. |
| Les six quartiers jouent sur la même géométrie : quatre portes, trois rues par axe. Seuls le volume et les profils changent. | Code | Des noms différents ne créent pas de nouvelle situation tactique. |
| Une ruine se reconstruit au prix plein. La « restauration à 90 » de `queueRepair` est inatteignable (code mort). | Mesuré | Les bâtisseurs ne restaurent rien : leur rôle promis reste à construire. |
| Une amélioration de service remet la structure au maximum. | Code | C'est un soin gratuit caché. À garder (en le disant au joueur) ou à retirer. |

## 2. Vision courte (proposée)

> **Rebâtir une capitale fragile pendant qu'une foule transforme ses rues.**
> Chaque construction ouvre une option tactique visible sur la carte. Chaque vague pose une question différente sur la lecture des rues.

Trois piliers, dans cet ordre de priorité :

1. **Lire** : voir d'où la foule vient, combien de personnes arrivent, dans combien de temps et vers quoi.
2. **Bâtir pour répondre** : un bâtiment débloque une réponse concrète, à un endroit précis, et son emplacement compte.
3. **Voir les conséquences** : un coup visible correspond à un dégât réel, une ruine reste en place jusqu'à ce que des bâtisseurs la restaurent, et le bilan explique la défaite.

Ce qui reste volontairement hors de cette tranche : online, double rôle, monde ouvert et loot (STREETZ), campagne de six cartes distinctes, armes létales.

## 3. Mission témoin (proposée)

Une seule mission de 8 à 12 minutes, sur une carte retouchée à la main à partir de la grille actuelle (même moteur).

| Élément | Proposition | Pourquoi |
| --- | --- | --- |
| Départ | Palais seul, sans troupe. **Budget de départ d'environ 300** : de quoi bâtir le commandement et une première équipe, pas tout le pays. | La croissance doit venir des vagues contenues et de l'économie, pas du capital initial. |
| Économie | Logements et commerces versent un revenu **pendant la préparation** (au fil du temps), en plus de la prime de vague. La prime de 3 crédits par personne dispersée est réduite ou supprimée. | La construction devient un investissement. La dispersion cesse d'être la principale source d'argent. |
| Vague 1 · « La rue nord » | Un seul accès. Une colonne visible dès la porte, avec un compte à rebours de contact affiché. Elle apprend le placement et la distance. | Premier choix compris sans tutoriel bavard. |
| Vague 2 · « La bifurcation » | Deux accès, dont un groupe qui change de cible quand une barricade ferme sa rue. Dégâts sur un commerce construit pendant la vague 1. | Arbitrage : réparer ou renforcer ? |
| Vague 3 · « Deux fronts » | Deux colonnes simultanées et une forte concentration sur une place. L'hélicoptère devient utile, sans suffire seul. | Le soutien aérien a un coût d'opportunité. |
| Défaite | Le bilan nomme la cause : « l'accès est est resté ouvert 40 s », « le commerce est tombé sans réparateurs », etc. | Une défaite comprise donne envie de relancer. |

Critères de réussite, à vérifier avec 3 à 5 personnes qui n'ont jamais vu le jeu et sans explication orale :

- elles savent quoi bâtir en premier ;
- elles peuvent dire pourquoi elles ont perdu ;
- deux stratégies différentes gagnent la mission (documentées et rejouées dans un test automatisé).

## 4. Backlog priorisé avec critères d'acceptation

### P1 — Lisibilité et construction (la mission témoin jouable)

| # | Élément | Acceptation |
| --- | --- | --- |
| P1.1 | **Télégraphie des vagues** : avant le lancement, les portes actives et l'effectif s'affichent sur la carte. Pendant le rassemblement, une flèche par groupe indique sa cible et son temps de contact estimé. | Test : la cible annoncée = la cible réelle au départ du groupe. Capture navigateur à 390 × 844 où les indicateurs restent visibles. |
| P1.2 | **Économie de mission** : budget de départ réglable par mission ; revenu des services pendant la préparation ; transactions centralisées (déjà fait : `spend()`). | Test : sur 3 graines, la stratégie de référence ne peut pas bâtir plus de 3 services avant la vague 1. |
| P1.3 | **Barrages en segments** : glisser pour tracer 2 à 4 cases contiguës ; aperçu du coût et de l'itinéraire de détour avant de payer. | Test : l'itinéraire prévisualisé = l'itinéraire réellement suivi. Aucune dépense si la pose échoue. |
| P1.4 | **Bâtisseurs visibles** : une équipe sort du chantier, marche jusqu'au bâtiment, répare ; elle s'arrête si la cible est attaquée (règle existante) et peut **restaurer une ruine** à prix réduit. | Test : une ruine restaurée retrouve son type et son niveau. Le trajet des bâtisseurs est visible dans une capture. |
| P1.5 | **Carte témoin** : 2 ou 3 accès retouchés, une place centrale, des terrains dont la position change la valeur (proche d'une porte = exposé, mais intervient plus tôt). | Deux parties gagnantes avec des implantations différentes. |
| P1.6 | **Bilan explicatif** : journal des causes (bâtiments perdus, accès ouverts, confiance). | Chaque défaite scriptée du test produit au moins une cause lisible. |
| P1.7 | **Banc navigateur persistant** : le script Playwright utilisé pour la reprise devient `npm run test:browser` (départ, construction, vague, prise du palais, sans erreur console). | Passe en CI. |

### P2 — Foule, impacts, palais

| # | Élément | Acceptation |
| --- | --- | --- |
| P2.1 | **Groupes cohérents** : un meneur par groupe, cohésion et bifurcation collective plutôt qu'agent par agent. | Un groupe bloqué par une barricade se réoriente d'un seul bloc (test), ce qui est visible dans une capture. |
| P2.2 | **Intentions différenciées** : part de la foule non violente (marche, se disperse vite, ne casse pas) et sous-groupes destructeurs signalés. La médiation agit sur les premiers, la force coûte de la confiance. | Test : la médiation seule peut contenir une vague composée uniquement de manifestants pacifiques. |
| P2.3 | **Coups synchronisés** : préparation, frappe puis récupération. Le dégât est appliqué à l'image de la frappe, plus en continu. | Test : la somme des dégâts = nombre de frappes × valeur, et chaque frappe émet un effet. |
| P2.4 | **Continuité du palais** : les acteurs de la scène finale sont issus des groupes présents devant le palais (au moins une partie), dans la même scène courte de 4,8 s. | Le type et la couleur des premiers entrants correspondent aux assaillants réels. |
| P2.5 | **Index spatial** (T04) et RNG visuel séparé (T07), avec mesure avant/après. | 250 agents et 2 hélicoptères à 2× : temps de simulation par image mesuré et documenté. |

### P3 et suivants

Profilage sur appareils physiques (iOS Safari, Android Chrome), validation de schéma des sauvegardes (T06), variation des quartiers à partir de la mission témoin, mixage audio, accessibilité (réduction des secousses, taille des cibles tactiles). Les extensions (mode foule, coopération, pays persistant) ne seront arbitrées qu'ensuite.

## 5. Décisions à prendre par le créateur

1. **Budget de départ serré** (environ 300) et économie en continu : d'accord pour casser l'équilibrage actuel des six quartiers pendant la construction de la mission témoin ?
2. **Foule différenciée** (une part pacifique) : souhaitée dès P2, ou toute la foule reste-t-elle hostile ?
3. **Récit du départ** : palais déjà là mais vulnérable (actuel), ou petite institution qui grandit jusqu'au palais ?
4. **Format prioritaire** : portrait téléphone, paysage ou ordinateur ?
5. **Soin caché à l'amélioration** : le garder (et l'afficher) ou le retirer ?
