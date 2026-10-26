# EMMET — V04 · Mission témoin

> Nouveautés V04 : mission témoin en 3 vagues écrites, départ à 320 crédits, revenus continus, vagues annoncées (portes, effectifs, trajet et temps de contact), foule sur cartes de flux, restauration des ruines par les bâtisseurs, bilan explicatif. Détails et preuves : `docs/validation.md`. Les sections ci-dessous décrivent la base V03 ; les chiffres d'économie qui y figurent sont remplacés par ceux de `web/data.js`.

Défense urbaine et construction dans le pays fictif de Nacreville. Jeu solo indépendant de STREETZ, en Canvas 2D isométrique.

## Le départ

**Un seul bâtiment existe au lancement : le palais présidentiel.** Aucune troupe ni aucun autre bâtiment n'est offert. Les neuf autres emplacements sont des terrains vides, y compris les trois anciens immeubles du prototype 02. La préparation n'a pas de limite de temps ; construire le commandement débloque les premières équipes, puis on lance la vague.

Toutes les cartes de construction sont consultables, même avant déblocage. Le texte indique le rôle, le prix et les dépendances. Sur téléphone, faire défiler la palette pour voir les neuf types.

| Construction | Fonction |
| --- | --- |
| Commandement | Patrouilles ; niveaux de formation et capacité d'unités |
| Académie | Boucliers et impulsions ; formation avancée |
| Chantier | Réparateurs automatiques, travaux sur les structures et fortifications avancées |
| Logistique | Fourgons à eau et filets de contrôle |
| Centre aérien | Drones au niveau 1 ; hélicoptères au niveau 2 |
| Médiation | Équipes de médiateurs, confiance et +45 crédits par niveau et par vague |
| Habitations | +35 crédits par niveau et par vague contenue |
| Commerces | +65 crédits par niveau et par vague contenue |
| Secours | Soins des équipes terrestres à quatre cases, 4 PV/s par niveau en préparation, 2 PV/s pendant les vagues |

Le commandement coûte 100 crédits. Chaque construction prend quatre secondes ; chaque amélioration de service prend six secondes. Les neuf emplacements peuvent accueillir librement les neuf types, un exemplaire de chaque. Chaque nouvelle partie repart du palais seul. Une sauvegarde précédente conserve les services construits par le joueur et retire les trois immeubles imposés auparavant.

## Protéger les bâtiments

La structure et la façade sont deux réserves distinctes. Les coups consomment d'abord la résistance de façade, puis les points de structure.

| Niveau | Protection visible | Résistance | Condition |
| --- | --- | --- | --- |
| 1 | Volets renforcés | 120 | Disponible immédiatement |
| 2 | Grilles de façade | 260 | Chantier niveau 1 |
| 3 | Périmètre sécurisé | 440 | Chantier niveau 2 |

Prix : 55 / 85 / 115 crédits. Une réparation de façade coûte 30 et restaure 160 points, sans soigner la structure. Les protections cassées restent visibles sous une forme dégradée. Les services construits par le joueur peuvent également recevoir ces protections.

Le chantier répare automatiquement les structures endommagées et permet de commander des travaux payants. Les réparations attendent la fin d'un assaut sur leur cible. Les barricades de rue gardent leurs trois niveaux séparés : 180 / 350 / 520 points. Elles provoquent un détour ou peuvent être brisées.

## Interventions et foule

Les équipes ont une formation, une direction et des poses distinctes pour l'attente, la marche et l'intervention. Les boucliers avancent en ligne ; les patrouilles interviennent en groupe. Jets d'eau, filets, impacts de bouclier et soins ont leurs propres signaux visuels. Les personnages de la foule marchent, courent, reculent ou frappent : bras et outils animés, éclats de façade, projections et secousses synchronisées aux coups.

Le centre aérien niveau 2 permet de déployer un hélicoptère de soutien pour 240 crédits. Il survole les obstacles, recherche une forte concentration de foule, ralentit et exerce une pression sur un maximum de dix-huit personnes dans son rayon. Rotor animé, ombre, projecteur, souffle et filet de zone sont rendus en temps réel. Aucun armement létal n'est simulé.

Les rassemblements apparaissent sur les approches extérieures, sept cases avant les anciennes portes de la ville. Les vagues vont de 24 à 120 personnes selon les six quartiers et leur progression. Les types adverses, leur cohésion, leur vitesse et leurs obstacles évoluent. Les personnages se séparent légèrement dans les rues pour rester lisibles. Une vague ne disparaît pas parce qu'un compteur expire : les groupes doivent se disperser ou réussir à prendre le palais.

## La prise du palais

Quand les points de structure du palais arrivent à zéro, la simulation passe dans une séquence de 4,8 secondes de jeu, lue à vitesse normale même si la bataille était accélérée. Elle ne se déclenche plus prématurément à 25 % de structure.

1. Le portail cède et la caméra se rapproche.
2. La vue intérieure dévoile le bureau présidentiel. Quarante-huit personnages franchissent physiquement le seuil et prennent position à l'intérieur ; un compteur suit les entrées.
3. Le chef d'État est capturé une fois la foule entrée, puis escorté à travers la même porte vers l'extérieur.
4. Le drapeau change et le régime est renversé. Le bilan de défaite s'affiche ensuite.

Le dirigeant est visible dans la pièce avant la capture. La séquence et les positions peuvent être sauvegardées puis reprises. La scène reste sans violence graphique.

## Son, commandes et données

Musique instrumentale originale : hip-hop à 86 BPM, basse et nappes mineures, avec une couche épique pendant l'intervention. Synthèse locale, sans extrait commercial ni voix rappée. MUSIQUE et SON se coupent séparément. La pause et le passage de la page en arrière-plan coupent la musique.

Glisser pour explorer ; pincer ou + / − pour zoomer. Touches 1–9 : interventions ; P/Espace : pause ; Entrée : vague ; Échap : annuler. Cliquer une équipe pour la déplacer, l'améliorer ou la soigner. TENIR, INTERCEPTER et REPLI changent les consignes.

Campagne, XP, étoiles, préférences et mission sont enregistrés sur l'appareil. Les sauvegardes v1/v2 sont migrées vers le schéma 3. Les anciennes foules visant un immeuble supprimé sont redirigées. L'interface et les URL des modules affichent la révision 03 afin de distinguer cette version de l'ancienne.

## Développement

Node ≥ 20 (`.nvmrc`). `npm ci` installe uniquement Prettier.

```sh
npm test            # règles et audio, Node seul
npm run format      # Prettier (format:check en CI)
npm run build       # web/ → dist/, révision ?v= tirée de REVISION (web/data.js)
python3 -m http.server 8000 --directory dist
```

Ne pas éditer `dist/`. Ne pas ouvrir `index.html` en `file://` (modules ES).


- `npm test` : tests Node déterministes, incluant départ à un seul palais, construction, revenus, soins, soutien aérien, fortifications, dégâts et poses, sauvegarde, migration, entrée réelle dans le palais et victoire sur les trois premières vagues.
- `npm run build` : export statique vers `dist/`, avec révision des imports et du CSS.
- `web/sim.js` : règles et sauvegarde ; `web/render.js` : rendu, terrain mis en cache, animations et intérieur ; `web/audio.js` : partition synthétique ; `web/app.js` : interface et campagne.

Prototype solo avec neuf emplacements prédéfinis. Pas de multijoueur, d'éditeur de terrain libre, de synchronisation entre appareils ou d'unité militaire jouable. Les niveaux tardifs demandent encore des retours d'équilibrage. Les bancs locaux de validation ne sont pas publiés.
