# Écran « Notes » et touche de secours

Statut : validée le 2026-11-10 (demande de l'auteur en conversation)
Date : 2026-11-10

## Besoin
Le site est protégé par un mot de passe (nginx, voir `infra/vps/README.md`). Une fois entré, la page ne doit pas montrer un
jeu : elle montre **un éditeur de texte pour prendre des notes**, comme Multiplay. Une touche de secours bascule entre
l'éditeur et le jeu, dans les deux sens.

## Comportement
- Au chargement, l'éditeur s'affiche, le jeu est caché (il se prépare dessous, comme d'habitude).
- La touche de secours est **F2** ou **Ctrl+Maj+Espace** : elle marche partout, y compris dans l'éditeur et en pleine partie.
  Elle n'agit pas en répétition (touche tenue).
- Écran tactile : un appui à **trois doigts** bascule aussi.
- Le jeu est mis en pause chaque fois que l'éditeur s'affiche (la pause automatique existante est réutilisée) ; il ne reprend pas
  tout seul au retour, comme après un onglet caché.
- Tant que l'éditeur est affiché, aucune touche n'atteint le jeu.
- Le texte des notes est gardé dans ce navigateur (`localStorage`, clé `notes.texte`), jamais envoyé. Si le stockage est refusé,
  les notes restent en mémoire pour la session.
- L'onglet s'appelle « Notes » et garde une icône de document neutre, jeu affiché ou non.

## Critères d'acceptation
- [ ] Au chargement, l'éditeur est visible et le jeu est caché.
- [ ] F2 et Ctrl+Maj+Espace basculent éditeur ↔ jeu ; une touche tenue ne rebascule pas.
- [ ] Le jeu en cours est en pause quand l'éditeur apparaît.
- [ ] Taper dans l'éditeur ne déclenche aucune commande du jeu (Espace, P, Q, E…).
- [ ] Le texte survit à un rechargement ; un stockage refusé ne casse rien.
- [ ] Le titre de l'onglet est « Notes », y compris avant le chargement du script.
