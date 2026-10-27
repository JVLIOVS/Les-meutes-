# EMMET — mémo pour Claude Code

Jeu solo web de construction + défense urbaine en **survie par manches** (sans fin, score = manche atteinte, record local), en français. JS natif, Canvas 2D isométrique, aucun backend, aucune dépendance runtime. Distinct de STREETZ (monde ouvert, clans, loot) : ne pas importer ces idées.

## Commandes
- `npm test` : règles (Node seul, ~10 s). Doit rester vert.
- `npm run format` / `format:check` : Prettier (CI).
- `npm run build` → `dist/` (ne jamais éditer `dist/`). Servir : `python3 -m http.server 8000 --directory dist`.
- Version affichée + cache `?v=` : `REVISION` dans `web/data.js`. L'incrémenter à chaque livraison visible.

## Carte du code
- `web/data.js` : quartiers (`plan` = vagues écrites à la main), équipements, foule, services, `INCOME`, `LULL`.
- `web/sim.js` : `CityGame` (règles, sauvegarde schéma 3). Chemins : `flowField`/`descend` (un champ par destination, cache vidé par `clearRoutes`). Toute dépense via `spend()`. Construction via `buildPlot()` (aperçu = pose).
- `web/render.js` : rendu ; `telegraph()` annonce les vagues.
- `web/app.js` : DOM, campagne, entrées, sauvegarde `localStorage` (`emmet.city.v1`).
- `tests/strategies.mjs` : stratégies de référence (`lines`, `fortress`, `passive`, `adaptive`) pour l'équilibrage.

## Invariants à ne pas casser
- Nouvelle partie = palais seul, zéro troupe, neuf terrains vides. Ne pas réimposer de bâtiments.
- Mode joué = quartier 0 « Nacreville » (`endless`) : 320 crédits, 3 manches écrites puis `escalateRound()` (plus de monde, 2→3→4 portes) et profils débloqués par manche (`ROUND_UNLOCKS`). `lines` et `fortress` tiennent 3 manches, `passive` tombe (3 graines). Les quartiers 1–5 restent dans le code mais ne sont plus proposés.
- Pas de revenu pendant la préparation (sinon attendre devient une stratégie).
- Aucune attaque de foule ne touche drone/hélico (`airborne`).
- Contact sol ou marque drone = interpellation (`held`) → fourgons **uniquement pendant l'accalmie** (`updateArrests`, un fourgon par tas, 8 max), +4/personne livrée au poste. Eau/médiation/filets = dispersion sans prime. Les `held` ne comptent jamais comme foule active.
- Fumigène et barrages passent par la carte de flux : tout ce qui ferme une rue doit appeler `clearRoutes()`.
- Une vague ne finit jamais par minuterie ; aucun gel (test de fumée sur les 6 quartiers).
- Prise du palais : 4,8 s, foule réellement à l'intérieur, sans violence graphique. Pays et dirigeant fictifs, pas d'arme létale.
- Sauvegardes : rester compatible schéma 1–3 (champs nouveaux avec valeurs par défaut).

- Boucle de rejeu : à chaque manche tenue, tirage de cartes (`CARDS`, `offerCards`/`pickCard`) qui **gèle l'accalmie** jusqu'au choix ; effets via `this.mods` uniquement. Grades permanents (`GRADES`, XP locale). Défi du jour = graine = date (mêmes manches et cartes pour tous). Le tirage utilise le RNG de la partie : ne pas l'appeler ailleurs sans raison.
- Direction artistique : **nuit néon** (sol sombre, arêtes de toit lumineuses, couche additive `lights()`). Garder la lisibilité : la foule reste orange, la police bleue.
- Cibles : App Store et Google Play via Capacitor (prochaine étape). Sécurité : tout le code embarqué, aucun chargement distant, pas d'`eval`, pas de SDK de traçage.

## Méthode (économie de tokens)
- Lire ce fichier, pas le dossier de reprise complet (`EMMET_DOSSIER_REPRISE_CLAUDE_CODE.md`, historique).
- Prouver par test ou par simulation (`tests/strategies.mjs`) avant de régler l'équilibrage à l'œil.
- Vérifier le rendu dans Chromium (Playwright préinstallé) seulement pour les changements visibles.
- Plan et backlog : `docs/PROPOSITION_V04.md`. Preuves : `docs/validation.md`.
