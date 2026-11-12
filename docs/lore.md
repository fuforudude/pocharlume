# Lore de Pocharlume

Tous les textes narratifs du jeu, regroupés. Modifie librement le texte après les deux-points ; garde la clé
entre accents graves (`…`) intacte, c'est elle qui dit où va le texte dans le jeu. Tu peux aussi ajouter des
paragraphes libres (idées, corrections d'univers) : ils seront reportés dans la spec et dans les textes concernés.

Ton voulu (spec) : entièrement sombre, textes courts et cryptiques, violence suggérée, jamais drôle, PEGI 12.

Les trois dieux ne sont pas des héros (spec `docs/specs/2026-10-29-dieux-sans-visage.md`) : ils ne sont jamais
incarnés ni dessinés. On ne les devine que par allusions, dans les descriptions des tours, des héros, des sorts,
des objets, des apparences et des niveaux, et dans les inscriptions des vieilles statues cachées sur chaque carte.
Partout, on ne les désigne que par des épithètes. Leurs vrais noms n'apparaissent que dans quelques récits anciens
de leurs exploits, gravés sur des statues que les hommes ont martelées (`inscription.marche`, `inscription.ruelles`,
`inscription.ponton`, `inscription.avenue`), jamais ailleurs. Les héros `heros.plume`, `heros.charlie` et
`heros.pollen` sont trois fidèles mortels, un par dieu. Les clés techniques ne changent pas.

Pas encore dans le jeu : les inscriptions des statues, les paroles avant les boss et la description des ennemis.
Elles sont écrites plus bas.

## Univers (note pour l'équipe : ce fond ne s'affiche jamais tel quel, il transparaît)

**La vieille guerre.** Il y a très longtemps, chats et hommes se sont fait la guerre. On en avait déjà oublié
l'origine. Parmi les chats, trois élus, presque des dieux :
- **Le Colosse** (`dieu.charlie`) a tenu « la porte » neuf jours, neuf semaines, neuf mois ; certains disent neuf
  années. Ce que la porte représente (le royaume ? le monde ?) reste inconnu. Il a protégé la vie. Dans les textes,
  il est la vie des chats et leur protection : chaleureux, insouciant, joyeux, puissant. Sobre, jamais drôle.
  Épithètes : le Colosse, Celui qui tient la porte.
- **L'Ombre** (`dieu.plume`), discrète de nature, a abandonné son ombre (son âme ?) et a terrifié les royaumes
  humains. Les hommes parlent encore d'elle pour faire peur aux enfants pas sages : le monstre sous le lit. La mort
  n'a pas su la trouver. Dans les textes, elle est la mort des hommes : la peur, le noir, l'ombre abandonnée.
  Épithètes : l'Ombre, Celle qui a laissé son ombre, la Silencieuse.
- **Trois-Pattes** (`dieu.pollen`), une femelle, ancienne doyenne et grande générale, très sage. Une embuscade est
  tombée sur sa troupe : tous les chats y sont passés, mais d'elle on n'a retrouvé que sa patte, dans un piège.
  Depuis, les troupes humaines ont traversé quantité de pièges, et certains jurent avoir entendu quelqu'un boiter
  non loin. Dans les textes, elle est la guerre des chats contre les hommes : stratégie, sagesse, pièges, embuscade,
  le pas boiteux qu'on entend. Épithètes : Trois-Pattes, Celle qui a laissé sa patte, la Doyenne, la Boiteuse.

**La porte.** Après la guerre, chats et hommes ont été séparés par la porte. Les hommes ont voulu oublier : ils ont
martelé les statues, raturé les noms. Maintenant la porte s'est rouverte et la guerre a recommencé.

**Aujourd'hui : l'An de la Grande Mort.** La guerre des hommes a pris la forme de l'Église du **Soleil Blême** : ils
ont oublié la vieille guerre et la croient sainte. L'Église a déclaré les chats serviteurs des sorcières : on les
brûle avec elles sur les bûchers, on les mange quand la famine vient, on les jette au puits pour conjurer la peste.
Et plus les chats meurent, plus les rats prolifèrent, et plus la peste tue. Personne ne fait le lien. Le premier
bûcher a été allumé le soir où la porte s'est rouverte. Les **braises** sont ce qui couve encore de la vieille
guerre.

Le joueur est **le Dernier Veilleur**, un chat sans nom qui veille à la porte rouverte, ranime les braises et
rassemble les survivants, région après région, jusqu'à la cathédrale où le Soleil Blême attend.

Trois fidèles portent le souvenir des élus : **Nielle**, qui souffle les lampes pour l'Ombre ; **Gond**, qui dort
contre les portes pour le Colosse ; **Clopin**, qui boite en mémoire de Trois-Pattes.

Les textes sont courts et cryptiques : descriptions d'objets, inscriptions des statues, murmures avant chaque
boss. Rien n'est drôle. La violence est suggérée (fumée, silhouettes, cendres) et jamais montrée en gros plan, pour
rester publiable sur le Play Store (classement PEGI 12 visé).

## Les trois dieux

Ce qu'on voit au choix avant un niveau : un symbole, une épithète, une phrase. Jamais de visage.

- `dieu.plume` : L’Ombre
- `dieu.plume.desc` : Celle qui a laissé son ombre. La mort l’a cherchée partout ; elle cherche encore.
- `dieu.charlie` : Le Colosse
- `dieu.charlie.desc` : Celui qui tient la porte. Il tiendra. Toujours.
- `dieu.pollen` : Trois-Pattes
- `dieu.pollen.desc` : La doyenne, plus rusée que tous. Un piège a gardé sa patte, elle a gardé leurs pièges.

## Héros

- `heros.plume` : Nielle, Souffle-Lampes
- `heros.plume.role` : Duelliste, esquive et critiques
- `heros.plume.desc` : Elle souffle les lampes avant d’entrer. Sans lumière, pas d’ombre : une façon de prier une ancienne divinité, paraît-il.
- `heros.suie` : Suie
- `heros.suie.role` : Assassin, exécute les blessés
- `heros.suie.desc` : Elle sent le brûlé. Ce qu’elle touche ne repart pas.
- `heros.corbeau` : Corbeau
- `heros.corbeau.role` : Tireur, perce l’armure
- `heros.corbeau.desc` : Il attend sur les toits que les cris s’éteignent.
- `heros.charlie` : Gond, le Portier
- `heros.charlie.role` : Tank, frappe de zone qui étourdit
- `heros.charlie.desc` : Il dort adossé aux portes, et ronronne. Derrière lui, les petits dorment aussi.
- `heros.mastoc` : Mastoc
- `heros.mastoc.role` : Provocation, bloque trois ennemis
- `heros.mastoc.desc` : Il a mangé tant de coups qu’ils lui reviennent par habitude.
- `heros.brise_os` : Brise-Os
- `heros.brise_os.role` : Berserker, plus fort blessé
- `heros.brise_os.desc` : Il ne sait plus à qui est le sang. Cela aide.
- `heros.pollen` : Clopin, le Tendeur
- `heros.pollen.role` : Pose des pièges, tire à la fronde
- `heros.pollen.desc` : Il boite comme on prie. Les hommes l’entendent avant de le voir, et pressent le pas.
- `heros.rouage` : Rouage
- `heros.rouage.role` : Ingénieur, construit une tourelle
- `heros.rouage.desc` : Le chat qui parlait aux oreilles des ressorts.
- `heros.lanterne` : Lanterne
- `heros.lanterne.role` : Soigneur, magie à distance
- `heros.lanterne.desc` : Une flamme sans mèche. Elle éclaire ceux qui doivent rester debout.
- `heros.titre` : Héros
- `heros.fermer` : Fermer
- `heros.reinitialiser` : Reprendre l’XP
- `heros.verrouille` : Pas encore recruté
- `heros.ultime` : Ultime
- `heros.plus` : +
- `heros.confirmer` : Recruter
- `heros.annuler` : Annuler

## Sorts des dieux

- `sort.voile_de_nuit` : Voile de Nuit
- `sort.voile_de_nuit.desc` : La peur des hommes tombe avec la nuit. Les pas s’alourdissent, les flèches trouvent la gorge.
- `sort.griffes_d_ombre` : Griffes d’Ombre
- `sort.griffes_d_ombre.desc` : Ce qui est de chair ne se relève pas. La mort passe derrière elle, et ne la trouve pas.
- `sort.chute_du_colosse` : Chute du Colosse
- `sort.chute_du_colosse.desc` : Le sol se souvient d’un poids qui n’a jamais reculé.
- `sort.renforts` : Renforts
- `sort.renforts.desc` : Deux gros matous sortent de la grange, la queue haute. Derrière une porte tenue, on n’a pas peur.
- `sort.pieges_a_ressort` : Pièges à Ressort
- `sort.pieges_a_ressort.desc` : Trois mâchoires dans la poussière. 
- `sort.ingeniosite` : Ingéniosité
- `sort.ingeniosite.desc` : Un peu d’os, beaucoup de ruse. Les machines voisines tournent comme la Boiteuse l’aurait voulu.

## Compétences des héros

- `comp.pas_de_velours` : Pas de velours
- `comp.pas_de_velours.desc` : Elle marche comme on lui a appris : sans bruit, sans ombre.
- `comp.griffe_fantome` : Griffe fantôme
- `comp.griffe_fantome.desc` : Elle frappe là où l’on ne regardait pas.
- `comp.reflet_vendu` : Ombre lâchée
- `comp.reflet_vendu.desc` : Elle a voulu laisser son ombre, comme l’autre. La sienne la suit encore, de loin.
- `comp.ombre_premiere` : Ombre prêtée
- `comp.ombre_premiere.desc` : Elle marche dans une ombre qui n’est pas la sienne.
- `comp.lame_courte` : Lame courte
- `comp.lame_courte.desc` : Courte, donc proche. Proche, donc fatale.
- `comp.soif_de_sang` : Soif
- `comp.soif_de_sang.desc` : Elle achève ce qui hésite à tomber.
- `comp.fumee` : Fumée
- `comp.fumee.desc` : On ne tient pas la fumée.
- `comp.cendre_et_silence` : Cendre et silence
- `comp.cendre_et_silence.desc` : Rien ne reste, pas même le bruit.
- `comp.oeil_noir` : Œil noir
- `comp.oeil_noir.desc` : Il voit plus loin que le dernier bûcher.
- `comp.bec_aiguise` : Bec aiguisé
- `comp.bec_aiguise.desc` : La cotte de mailles n’est qu’une promesse.
- `comp.plumes_de_nuit` : Pennes de nuit
- `comp.plumes_de_nuit.desc` : Les ailes battent, les flèches suivent.
- `comp.festin` : Festin
- `comp.festin.desc` : Les charognards ne perdent jamais.
- `comp.poigne_de_fer` : Poigne de fer
- `comp.poigne_de_fer.desc` : Ce qu’il tient est à l’abri. Ce qu’il serre, beaucoup moins.
- `comp.peau_epaisse` : Peau épaisse
- `comp.peau_epaisse.desc` : Il a dormi contre des portes chaudes. Il en garde la chaleur.
- `comp.onde_de_choc` : Onde de choc
- `comp.onde_de_choc.desc` : Le coup continue après le coup.
- `comp.neuf_nuits` : Dixième nuit
- `comp.neuf_nuits.desc` : Un autre a tenu neuf ans, dit-on. Il tiendra la dixième nuit.
- `comp.mur_de_chair` : Mur de chair
- `comp.mur_de_chair.desc` : Un mur qui respire.
- `comp.cri_de_defi` : Cri de défi
- `comp.cri_de_defi.desc` : Tous les regards, et tous les coups.
- `comp.cuirasse_de_clous` : Cuirasse de clous
- `comp.cuirasse_de_clous.desc` : Chaque coup en laisse un autre.
- `comp.rempart_vivant` : Rempart vivant
- `comp.rempart_vivant.desc` : Ce qu’on abat se relève.
- `comp.colere` : Colère
- `comp.colere.desc` : Plus il saigne, moins il compte.
- `comp.broyeur` : Broyeur
- `comp.broyeur.desc` : Les os parlent avant lui.
- `comp.faim_de_loup` : Faim de loup
- `comp.faim_de_loup.desc` : Il se nourrit de ce qu’il casse.
- `comp.os_brises` : Os brisés
- `comp.os_brises.desc` : Il ne reste que le bruit.
- `comp.ressorts_rouilles` : Ressorts rouillés
- `comp.ressorts_rouilles.desc` : Il les déterre au bord des vieilles routes. Ils attendaient depuis la vieille guerre.
- `comp.fronde_tordue` : Fronde tordue
- `comp.fronde_tordue.desc` : Elle vise mal, et touche quand même.
- `comp.trois_pattes` : Pas boiteux
- `comp.trois_pattes.desc` : Il boite par respect. Les hommes, eux, croient entendre une autre.
- `comp.maitre_des_pieges` : Maître des pièges
- `comp.maitre_des_pieges.desc` : Il tend les mâchoires comme une autre, avant lui. Le geste est resté.
- `comp.boulons_neufs` : Boulons neufs
- `comp.boulons_neufs.desc` : Les carreaux sont plus lourds que les remords.
- `comp.deuxieme_servant` : Deuxième servant
- `comp.deuxieme_servant.desc` : Une tourelle seule s’ennuie.
- `comp.huile_noire` : Huile noire
- `comp.huile_noire.desc` : Les engrenages ne dorment plus.
- `comp.automate` : Automate
- `comp.automate.desc` : Il construit sans lui. Il pense sans lui.
- `comp.flamme_douce` : Flamme douce
- `comp.flamme_douce.desc` : Une chaleur qui ne demande rien.
- `comp.halo_de_cire` : Halo de cire
- `comp.halo_de_cire.desc` : La lumière s’étale, les ombres reculent. Sauf une.
- `comp.cire_et_cendre` : Cire et cendre
- `comp.cire_et_cendre.desc` : Ce qui fond protège ce qui brûle.
- `comp.derniere_lueur` : Dernière lueur
- `comp.derniere_lueur.desc` : Elle s’éteint en dernier.

## Tours

- `tour.grenier_des_griffes` : Grenier des Griffes
- `tour.garde_du_cloitre` : Garde du Cloître
- `tour.ecorcheurs` : Écorcheurs
- `tour.clocher_des_archers` : Clocher des Archers
- `tour.guetteurs_des_toits` : Guetteurs des Toits
- `tour.arbaletriers_du_beffroi` : Arbalétriers du Beffroi
- `tour.autel_des_cendres` : Autel des Cendres
- `tour.oracle_de_la_braise` : Oracle de la Braise
- `tour.necromancien_des_neuf_vies` : Nécromancien des Neuf Vies
- `tour.catapulte_du_rempart` : Catapulte du Rempart
- `tour.mortier_de_soufre` : Mortier de Soufre
- `tour.baliste_a_chaines` : Baliste à Chaînes
- `unite.chat_de_grange` : Chat de grange
- `unite.garde_du_cloitre` : Chat en cotte de mailles
- `unite.ecorcheur` : Écorcheur
- `unite.spectre` : Spectre
- `unite.gros_matou` : Gros matou
- `tour.totem_du_colosse` : Totem du Colosse
- `tour.sanctuaire_de_l_ombre` : Sanctuaire de l’Ombre
- `tour.atelier_boiteux` : Atelier de la Boiteuse
- `unite.assassin_du_sanctuaire` : Assassin de l’ombre
- `unite.tourelle_de_l_atelier` : Tourelle de l’Atelier
- `unite.tourelle_de_rouage` : Tourelle de Rouage
- `unite.chat_de_renfort` : Chat de renfort

## Compétences des tours

- `comptour.benediction` : Bénédiction
- `comptour.benediction.desc` : Les plaies se ferment, sans prière.
- `comptour.mur` : Mur
- `comptour.mur.desc` : Les cottes tiennent debout après la mort, comme une porte qu’on n’a pas lâchée.
- `comptour.entailles_profondes` : Entailles profondes
- `comptour.entailles_profondes.desc` : Le sang coule longtemps, et ne s’arrête pas seul.
- `comptour.frenesie` : Frénésie
- `comptour.frenesie.desc` : Les lames ne retombent plus.
- `comptour.venin_noir` : Venin noir
- `comptour.venin_noir.desc` : Une pointe suffit. Le reste est patience.
- `comptour.oeil_de_lynx` : Œil de lynx
- `comptour.oeil_de_lynx.desc` : Le toit regarde plus loin que la rue.
- `comptour.tir_a_la_tete` : Tir à la tête
- `comptour.tir_a_la_tete.desc` : Un carreau, un nom barré.
- `comptour.carreau_perforant` : Carreau perforant
- `comptour.carreau_perforant.desc` : Le fer cède, la chair suit.
- `comptour.rayon_concentre` : Rayon concentré
- `comptour.rayon_concentre.desc` : La braise se resserre sur une seule âme.
- `comptour.braise_tenace` : Braise tenace
- `comptour.braise_tenace.desc` : Elle couve sous la peau.
- `comptour.legion` : Légion
- `comptour.legion.desc` : Les morts répondent plus nombreux.
- `comptour.os_durcis` : Os durcis
- `comptour.os_durcis.desc` : Ils sont revenus plus durs que vivants.
- `comptour.nappe_de_soufre` : Nappe de soufre
- `comptour.nappe_de_soufre.desc` : Le sol brûle après le coup.
- `comptour.charge_lourde` : Charge lourde
- `comptour.charge_lourde.desc` : Plus de poudre, moins de questions.
- `comptour.chaines_longues` : Chaînes longues
- `comptour.chaines_longues.desc` : Un maillon de plus, un voisin de plus.
- `comptour.entraves` : Entraves
- `comptour.entraves.desc` : Marcher devient un travail. Boiter, une prière.

## Ennemis et boss

- `ennemi.paysan_affame` : Paysan Affamé
- `ennemi.mendiant` : Mendiant
- `ennemi.chien_errant` : Chien Errant
- `ennemi.boucher_vaudrelle` : Le Boucher de Vaudrelle
- `ennemi.glaneur` : Glaneur
- `ennemi.corbeau_noir` : Corbeau Noir
- `ennemi.epouvantail` : Épouvantail
- `ennemi.la_faim` : La Faim
- `ennemi.porteur_torche` : Porteur de Torche
- `ennemi.chasseur_sorcieres` : Chasseur de Sorcières
- `ennemi.delateur` : Délateur
- `ennemi.juge_flammes` : Le Juge des Flammes
- `ennemi.noyeur` : Noyeur
- `ennemi.pelerin_voile` : Pèlerin Voilé
- `ennemi.sangsue` : Sangsue
- `ennemi.dame_puits` : La Dame du Puits
- `ennemi.rat_peste` : Rat de Peste
- `ennemi.pestifere` : Pestiféré
- `ennemi.medecin_peste` : Médecin de Peste
- `ennemi.mere_rats` : La Mère des Rats
- `ennemi.fossoyeur` : Fossoyeur
- `ennemi.creux` : Creux
- `ennemi.chauve_souris` : Chauve-Souris
- `ennemi.roi_fosses` : Le Roi des Fosses
- `ennemi.fantassin` : Fantassin
- `ennemi.porte_banniere` : Porte-Bannière
- `ennemi.cavalier` : Cavalier
- `ennemi.prince_croise` : Le Prince Croisé
- `ennemi.flagellant` : Flagellant
- `ennemi.inquisiteur` : Inquisiteur
- `ennemi.exorciste` : Exorciste
- `ennemi.grand_inquisiteur` : Le Grand Inquisiteur
- `ennemi.garde_royal` : Garde Royal
- `ennemi.arbaletrier_elite` : Arbalétrier d’Élite
- `ennemi.chevalier` : Chevalier
- `ennemi.roi_fou` : Le Roi Fou
- `ennemi.acolyte_cendre` : Acolyte de Cendre
- `ennemi.ange_cendre` : Ange de Cendre
- `ennemi.soleil_bleme` : Le Soleil Blême
- `ennemi.coupe_bourse` : Coupe-Bourse
- `ennemi.grand_manteau` : Grand Manteau
- `ennemi.gerbe_ardente` : Gerbe Ardente
- `ennemi.porte_herse` : Porte-Herse
- `ennemi.fagotier` : Fagotier
- `ennemi.crieur_public` : Crieur Public
- `ennemi.crapaud_gonfle` : Crapaud Gonflé
- `ennemi.lueur_marais` : Lueur des Marais
- `ennemi.montreur_rats` : Montreur de Rats
- `ennemi.bubonneux` : Bubonneux
- `ennemi.deterreur` : Déterreur
- `ennemi.fagot_os` : Fagot d’Os
- `ennemi.sapeur` : Sapeur
- `ennemi.aumonier` : Aumônier de Guerre
- `ennemi.chantre` : Chantre
- `ennemi.frere_sans_porte` : Frère Sans-Porte
- `ennemi.effigie_roi` : Effigie du Roi
- `ennemi.bourreau_roi` : Bourreau du Roi
- `ennemi.gargouille` : Gargouille
- `ennemi.martyr_bleme` : Martyr Blême
- `ennemi.passeur` : Le Passeur

## Ennemis : descriptions

- `ennemi.paysan_affame.desc` : Il a mangé ses bêtes, puis ses semences. Il cherche ce qui reste.
- `ennemi.mendiant.desc` : Il tend une main vide. L’autre est derrière son dos.
- `ennemi.chien_errant.desc` : Son maître est sur un bûcher. Il a appris à chasser seul.
- `ennemi.boucher_vaudrelle.desc` : Son étal reste pleine. Personne ne demande d’où vient la viande.
- `ennemi.glaneur.desc` : Il ramasse ce que les autres laissent tomber. Parfois, ce sont des chats.
- `ennemi.corbeau_noir.desc` : Il suit les fourches à distance. Il sait toujours où elles vont.
- `ennemi.epouvantail.desc` : Personne ne l’a planté là. Il avance quand on ne le regarde pas.
- `ennemi.la_faim.desc` : Elle n’a pas de ventre, seulement des champs à vider.
- `ennemi.porteur_torche.desc` : Il ne sait pas ce qu’il brûle. On le lui a dit, ça suffit.
- `ennemi.chasseur_sorcieres.desc` : Il porte des mâchoires de fer à la ceinture. L’une a déjà servi.
- `ennemi.delateur.desc` : Il ne frappe personne. Il donne des noms.
- `ennemi.juge_flammes.desc` : Il a allumé le premier bûcher, le soir où la porte s’est rouverte. Il en parle avec tendresse.
- `ennemi.noyeur.desc` : Il tient les accusées sous l’eau, et compte lentement.
- `ennemi.pelerin_voile.desc` : Sous le voile, il n’y a pas de visage. Il y a de l’eau.
- `ennemi.sangsue.desc` : Elle prend peu, mais elle ne lâche jamais.
- `ennemi.dame_puits.desc` : On lui a jeté tant de chats qu’elle les appelle par leur nom.
- `ennemi.rat_peste.desc` : Il court là où les chats ne sont plus.
- `ennemi.pestifere.desc` : Il marche encore. La fièvre décide où.
- `ennemi.medecin_peste.desc` : Sous le bec, des herbes et de l’encens. Il recommande toujours le feu.
- `ennemi.mere_rats.desc` : Elle a attendu que le dernier chat brûle. Puis elle a pondu.
- `ennemi.fossoyeur.desc` : Sa pelle n’a jamais séché. Il creuse aussi pour les vivants.
- `ennemi.creux.desc` : On l’a enterré trop vite. Il revient chercher ce qu’on lui a pris.
- `ennemi.chauve_souris.desc` : Elle sort des côtes du charnier à l’heure des vêpres.
- `ennemi.roi_fosses.desc` : Sa couronne est faite de dents. Il les a comptées une à une.
- `ennemi.fantassin.desc` : Il a quitté son champ pour une croix. Il croit la guerre sainte ; elle est seulement très vieille.
- `ennemi.porte_banniere.desc` : Tant que la bannière flotte, ils ne reculent pas. Elle est cousue de suaires.
- `ennemi.cavalier.desc` : Le cheval connaît la route. Le cavalier ne regarde plus.
- `ennemi.prince_croise.desc` : Il a béni chaque lame de sa main. Les siens sont tombés quand même.
- `ennemi.flagellant.desc` : Il se frappe pour expier. Il frappe les autres pour les aider.
- `ennemi.inquisiteur.desc` : Il connaît la question. La réponse n’a jamais changé l’issue.
- `ennemi.exorciste.desc` : Il chasse les démons à l’eau bénite. Il dort pourtant la lampe allumée.
- `ennemi.grand_inquisiteur.desc` : Il a gratté trois noms de la pierre. Il les entend encore la nuit.
- `ennemi.garde_royal.desc` : Il garde une porte qui ne mène qu’à la folie du roi.
- `ennemi.arbaletrier_elite.desc` : Il tire avant l’ordre. On ne le lui reproche jamais.
- `ennemi.chevalier.desc` : L’armure avance seule depuis longtemps. Elle se souvient d’avoir eu un homme.
- `ennemi.roi_fou.desc` : Il a fait sculpter cent statues de lui. Il n’en a abattu que trois autres.
- `ennemi.acolyte_cendre.desc` : Il chante une prière pâle. Sa voix tombe en cendre avant de finir.
- `ennemi.ange_cendre.desc` : Ses ailes sont faites de ce qui a brûlé. Il en a de très grandes.
- `ennemi.soleil_bleme.desc` : Il n’éclaire pas. Il pâlit ce qu’il regarde, jusqu’à la cendre.
- `ennemi.coupe_bourse.desc` : Il coupe la bourse, jamais la corde. Il laisse ça aux autres.
- `ennemi.grand_manteau.desc` : Sous le manteau, ils se serrent pour avoir chaud. Ils sont plus nombreux qu’on ne le croit.
- `ennemi.gerbe_ardente.desc` : On a brûlé le champ avec la récolte. La gerbe, elle, a marché jusqu’au village.
- `ennemi.porte_herse.desc` : Il a décroché la herse du champ. Les dents regardent devant, comme lui.
- `ennemi.fagotier.desc` : Il porte le bois des autres. Il sait déjà pour qui.
- `ennemi.crieur_public.desc` : Il lit la sentence avant le procès. On l’applaudit.
- `ennemi.crapaud_gonfle.desc` : On lui a jeté tout ce que le marais n’a pas voulu. Il l’a gardé.
- `ennemi.lueur_marais.desc` : Elle mène au fond de l’eau ceux qui la suivent. Elle n’a jamais eu besoin d’appeler.
- `ennemi.montreur_rats.desc` : Il les nourrit de la main, puis les lâche. Il jure que les rats viennent d’eux-mêmes.
- `ennemi.bubonneux.desc` : La peste le recoud à mesure. Il se croit béni.
- `ennemi.deterreur.desc` : Il ouvre les tombes pour ce qu’on y a laissé. Elles se referment derrière lui.
- `ennemi.fagot_os.desc` : Ce qu’on n’a pas pu brûler a été lié en fagot. Il tient debout seul.
- `ennemi.sapeur.desc` : Il a marché sur tous les pièges de la vieille guerre. Il sait où ils dorment.
- `ennemi.aumonier.desc` : Il bénit les plaies et défait les liens. Les blessés l’appellent Père ; les autres, non.
- `ennemi.chantre.desc` : Le chant est si pur qu’on oublie de bouger. Le silence, après, dure longtemps.
- `ennemi.frere_sans_porte.desc` : Une porte sans battant sur la poitrine. Nul ne l’arrête : on n’arrête pas une porte ouverte.
- `ennemi.effigie_roi.desc` : L’une des cent statues du roi. Elle a quitté son socle quand il a cessé de se reconnaître.
- `ennemi.bourreau_roi.desc` : Il tranche ceux que le roi n’a plus envie de voir. Il ne regarde jamais leurs visages.
- `ennemi.gargouille.desc` : Elle crache la pluie depuis le toit. Quand il ne pleut plus, elle descend.
- `ennemi.martyr_bleme.desc` : Il s’est offert au Soleil Blême. Sa dernière lueur ne lui appartient plus.
- `ennemi.passeur.desc` : Il a laissé sa barque pourrir dans les marais. Il fait toujours payer le passage, et ne dit jamais vers où.

## DLC « Temps modernes » : ennemis

Ton propre au DLC (spec `docs/specs/2026-11-12-dlc-temps-modernes-campagne.md`) : satire en dessin, comme les skins. Les chats
sont des étudiants mobilisés, les humains les forces de l'ordre ; uniformes génériques, ni insigne, ni nom réel, ni violence
réaliste. Une phrase courte, pince-sans-rire, qui se moque de la fonction plus que de la personne.

- `ennemi.moderne_gendarme` : Gendarme
- `ennemi.moderne_crs` : CRS
- `ennemi.moderne_gendarme_mobile` : Gendarme Mobile
- `ennemi.moderne_bouclier_anti_emeute` : Bouclier Anti-Émeute
- `ennemi.moderne_tireur_lbd` : Tireur de LBD
- `ennemi.moderne_grenadier_lacrymo` : Grenadier Lacrymogène
- `ennemi.moderne_bac` : Agent de la BAC
- `ennemi.moderne_commissaire` : Commissaire
- `ennemi.moderne_bravm` : BRAV-M
- `ennemi.moderne_cavalier_monte` : Cavalier de la Police Montée
- `ennemi.moderne_drone` : Drone
- `ennemi.moderne_helicoptere` : Hélicoptère
- `ennemi.moderne_canon_a_eau` : Canon à Eau
- `ennemi.moderne_centaure` : Centaure
- `ennemi.moderne_prefet` : Le Préfet
- `ennemi.moderne_commissaire_boss` : Le Commissaire Divisionnaire
- `ennemi.moderne_centaure_boss` : Le Grand Centaure

- `ennemi.moderne_gendarme.desc` : Il est venu vérifier que la manifestation était déclarée. Elle ne l’était pas : il est resté.
- `ennemi.moderne_crs.desc` : Trois manifs cette semaine, toujours du même côté de la ligne. Il dit que c’est le bon.
- `ennemi.moderne_gendarme_mobile.desc` : Formé aux grands rassemblements. Il garde ses meilleurs coups pour ceux qui tiennent le mégaphone.
- `ennemi.moderne_bouclier_anti_emeute.desc` : Derrière son bouclier, il ne voit rien venir. C’est tout l’intérêt.
- `ennemi.moderne_tireur_lbd.desc` : Le règlement dit de viser les jambes. Le règlement ne dit rien des enceintes.
- `ennemi.moderne_grenadier_lacrymo.desc` : Il disperse la foule et l’air avec. Après son passage, tout le monde pleure, lui compris.
- `ennemi.moderne_bac.desc` : Jean, baskets, brassard dans la poche. Discret jusqu’au moment précis où il ne l’est plus.
- `ennemi.moderne_commissaire.desc` : Il ne court jamais. Il dit aux autres de courir plus vite.
- `ennemi.moderne_bravm.desc` : Ils vont toujours par deux : un qui conduit, un qui frappe. Seul, le survivant conduit plus vite.
- `ennemi.moderne_cavalier_monte.desc` : Le cheval a fait une école de dressage. Le cavalier, une école de maintien de l’ordre. Le cheval a eu la mention.
- `ennemi.moderne_drone.desc` : Il filme tout, pour l’enquête. L’enquête n’en regardera que la moitié.
- `ennemi.moderne_helicoptere.desc` : Il tourne au-dessus du cortège depuis midi. Personne ne sait qui paie le kérosène.
- `ennemi.moderne_canon_a_eau.desc` : Il nettoie la place en un seul passage. La place, et ce qui se tenait dessus.
- `ennemi.moderne_centaure.desc` : Dix tonnes de blindage pour un carrefour. On n’est jamais trop prudent avec un carrefour.
- `ennemi.moderne_prefet.desc` : Il signe les arrêtés le matin et les communiqués le soir. Entre les deux, il regarde la carte.
- `ennemi.moderne_commissaire_boss.desc` : Il a reçu des ordres d’en haut. Il les répète, plus fort, à tout ce qui est en bas.
- `ennemi.moderne_centaure_boss.desc` : Le dernier modèle, option canon et marchepied. Il a coûté plus cher que la fac qu’il assiège.

## DLC « Temps modernes » : niveaux, région 1 (la Fac)

Occupation de la fac et AG (niveaux 1 à 10 de la campagne `moderne`, spec `docs/specs/2026-11-12-dlc-temps-modernes-campagne.md`,
tâche 5) : même ton que les ennemis du DLC, satire pince-sans-rire des institutions, ni nom réel, ni insigne, ni violence réaliste.

- `niveau.m1.01.nom` : L’Amphi Occupé
- `niveau.m1.01.ambiance` : Le cours de droit constitutionnel est suspendu. On y vote quand même, à main levée.
- `niveau.m1.02.nom` : Les Couloirs
- `niveau.m1.02.ambiance` : Les casiers sont fermés, les tracts ouverts. Le secrétariat rouvre lundi, dit l’affiche de l’an dernier.
- `niveau.m1.03.nom` : La Cour
- `niveau.m1.03.ambiance` : Sous les platanes, on refait le monde. De l’autre côté de la grille, on vient le défaire.
- `niveau.m1.04.nom` : La Bibliothèque
- `niveau.m1.04.ambiance` : Silence, on révise la Constitution. Le canon à eau n’a pas de carte de lecteur.
- `niveau.m1.05.nom` : Le Resto U
- `niveau.m1.05.ambiance` : Plat du jour : coquillettes. Les agents en civil ont pris le menu, mais pas le plateau.
- `niveau.m1.06.nom` : Le Parvis
- `niveau.m1.06.ambiance` : La grille du nord est cadenassée. Le cadenas aussi a un avis sur la réforme.
- `niveau.m1.07.nom` : Le Piquet de Grève
- `niveau.m1.07.ambiance` : Trois palettes, un brasero, une thermos. Ce n’est pas une barricade, c’est un piquet : la nuance est juridique.
- `niveau.m1.08.nom` : L’Assemblée Générale
- `niveau.m1.08.ambiance` : Motion pour, motion contre, motion pour voter la motion. Dehors, quelqu’un a déjà tranché.
- `niveau.m1.09.nom` : Le Grand Hall
- `niveau.m1.09.ambiance` : Les escaliers mènent partout sauf à la sortie. Le plan d’évacuation, lui, a été évacué.
- `niveau.m1.10.nom` : Le Rectorat
- `niveau.m1.10.ambiance` : Le Commissaire Divisionnaire est attendu pour une visite de courtoisie. Il a amené sa courtoisie en fourgon.

## Paroles avant les boss

Ce ne sont plus les dieux qui parlent : un murmure, une inscription, une voix sans source.

- `boss.r1.parole` : Gravé sur l’étal, sous le sang sec : « Ici, on pesait les chats. La balance penche encore. »
- `boss.r2.parole` : Le vent dans les gerbes creuses : « Elle a tout mangé. Il reste celui qui veille. »
- `boss.r3.parole` : Un murmure sous les fagots : « Le premier feu s’est allumé le soir où la porte a cédé. Celui-ci n’en est que l’écho. »
- `boss.r4.parole` : Une voix sous l’eau, sans bouche : « Elle non plus n’a jamais coulé. Ne lui demande pas pourquoi. »
- `boss.r5.parole` : Gratté dans le mur d’une cave : « Ils ont brûlé ceux qui gardaient le grain. Les rats s’en souviennent. »
- `boss.r6.parole` : Une voix qui monte des fosses : « Il compte ses morts. Ne lui donne pas ton nom. »
- `boss.r7.parole` : Brodé sur une bannière déchirée : « Pour la Croix et le Soleil. » Dessous, plus ancien : « Pour la porte. »
- `boss.r8.parole` : Une voix qui ne vient d’aucune cellule : « Il a tout lu. Sauf ce qu’on n’a jamais écrit. »
- `boss.r9.parole` : Sous le trône, à demi effacé : « La couronne parle. Les statues… se taisent pour toi. »
- `boss.r10.parole` : Personne ne parle. Seulement, très bas : « Garde tes braises dans l’ombre. La mort n’a jamais trouvé celle qui n’en a plus. »
- `boss.r11.parole` : Gravé sur une rame plantée dans le sable : « Une obole pour passer. Personne n’a jamais dit qu’il y avait une autre rive. »

## DLC « Temps modernes » : paroles avant les boss

Une réplique par boss du DLC, clé construite sur la campagne (`boss.m<région>.parole` : la Fac, la Manif, la Préfecture). Même ton :
satire pince-sans-rire, aucun nom réel, aucun insigne, aucune violence réaliste.

- `boss.m1.parole` : Dans le mégaphone du commissaire, tout bas : « Je ne suis pas là pour la fac. Je suis là pour le procès-verbal. »
- `boss.m2.parole` : Sur le flanc du Centaure, en lettres blanches : « Véhicule de dialogue. Veuillez ne pas dialoguer avec le véhicule. »
- `boss.m3.parole` : Sous la porte de la préfecture, un arrêté glissé à la main : « Le préfet vous reçoit tout de suite. Prenez un ticket pour mardi. »

## Régions

- `region.1` : Le Village Affamé
- `region.2` : Les Champs Brûlés
- `region.3` : Le Bourg des Bûchers
- `region.4` : Les Marais de l’Ordalie
- `region.5` : La Ville Pestiférée
- `region.6` : Le Charnier
- `region.7` : La Croisade
- `region.8` : Le Monastère Noir
- `region.9` : La Cité du Roi
- `region.10` : La Cathédrale du Soleil Blême

## Cartes

- `carte.nom.chaumes` : Les Chaumes
- `carte.nom.gue` : Le Gué
- `carte.nom.pendus` : Les Pendus
- `carte.nom.carrefour` : Le Carrefour
- `carte.nom.sillons` : Les Sillons
- `carte.nom.meules` : Les Meules
- `carte.nom.aire` : L’Aire
- `carte.nom.ruelles` : Les Ruelles
- `carte.nom.place` : La Place
- `carte.nom.beffroi` : Le Beffroi
- `carte.nom.ponton` : Le Ponton
- `carte.nom.etang` : L’Étang
- `carte.nom.saules` : Les Saules
- `carte.nom.quarantaine` : La Quarantaine
- `carte.nom.faubourg` : Le Faubourg
- `carte.nom.marche` : Le Marché
- `carte.nom.fossoyage` : Le Fossoyage
- `carte.nom.tertres` : Les Tertres
- `carte.nom.ossuaire` : L’Ossuaire
- `carte.nom.bivouac` : Le Bivouac
- `carte.nom.palissade` : La Palissade
- `carte.nom.baliste` : La Baliste
- `carte.nom.cloitre` : Le Cloître
- `carte.nom.refectoire` : Le Réfectoire
- `carte.nom.scriptorium` : Le Scriptorium
- `carte.nom.avenue` : L’Avenue
- `carte.nom.douves` : Les Douves
- `carte.nom.pont_levis` : Le Pont-Levis
- `carte.nom.nef` : La Nef
- `carte.nom.transept` : Le Transept
- `carte.nom.choeur` : Le Chœur
- `carte.nom.greve` : La Grève
- `carte.nom.filets` : Les Filets
- `carte.nom.epaves` : Les Épaves
- `carte.nom.ponton_noir` : Le Ponton Noir
- `carte.nom.cap_corbeaux` : Le Cap aux Corbeaux
- `carte.nom.eau_morte` : L’Eau Morte
- `carte.nom.pontons` : Les Pontons
- `carte.nom.passe_noyes` : La Passe des Noyés
- `carte.nom.baie_morte` : La Baie Morte
- `carte.nom.naufrage` : Le Naufrage

## Inscriptions des statues

Une vieille statue par carte. Répartition (pour la relecture, rien de cela n’est affiché) : le Colosse (chaumes,
meules, beffroi, marche, fossoyage, bivouac, refectoire, pont_levis, greve, eau_morte, naufrage), l’Ombre (gue, aire,
ruelles, etang, ossuaire, cloitre, nef, choeur, epaves, cap_corbeaux), Trois-Pattes (carrefour, sillons, ponton, faubourg,
tertres, palissade, douves, transept, filets, pontons, baie_morte), les hommes et l’Église qui veulent effacer (pendus, place,
saules, quarantaine, baliste, scriptorium, avenue, ponton_noir, passe_noyes). Les dix statues de la région 11 sont celles
d’après l’histoire : la porte est fermée, il ne reste que l’eau, et ceux qui font payer le passage.
Vrais noms : marche et avenue pour le Colosse, ruelles et avenue pour l’Ombre, ponton et avenue pour Trois-Pattes.

- `inscription.chaumes` : Neuf jours il a tenu la porte. Derrière lui, on rentrait les foins, et des petits naissaient.
- `inscription.gue` : Ne cherche pas son ombre dans l’eau. Elle l’a laissée un soir, comme on pose un manteau.
- `inscription.pendus` : Par ordre du Soleil Blême : qui nourrit un chat nourrit la sorcière. Les cordes sont prêtes.
- `inscription.carrefour` : Trois routes, trois pattes. Prends celle qui boite : c’est la seule qu’elle n’a pas armée.
- `inscription.sillons` : Elle a semé des ressorts sous les sillons. Les rats n’ont pas passé l’hiver. Les hommes ont oublié pourquoi.
- `inscription.meules` : Neuf semaines. Les torches s’usaient contre lui. Lui, non.
- `inscription.aire` : Les rois ont doublé leurs gardes, puis leurs lampes. Au matin, il n’y avait plus de rois.
- `inscription.ruelles` : Plume passa sous les murs des hommes… Depuis, leurs mères disent son nom aux enfants qui ne dorment pas.
- `inscription.place` : Ici fut allumé le premier bûcher, le soir où la porte s’est rouverte. On le crut saint.
- `inscription.beffroi` : Neuf mois, disent les vieux. Neuf ans, disent les plus vieux. La porte, elle, ne dit rien.
- `inscription.ponton` : Pollen, la doyenne, mena la troupe au gué. Les hommes attendaient… Au matin, il ne restait qu’une patte, dans un piège.
- `inscription.etang` : La mort l’a cherchée dans l’eau, dans le feu, sous la terre. Elle cherche encore.
- `inscription.saules` : Il n’y a jamais eu de guerre. Il n’y a jamais eu de porte. Répète-le jusqu’à le croire.
- `inscription.quarantaine` : Le mal venait des chats. Les chats sont morts. Le mal…
- `inscription.faubourg` : Ils ont ouvert le piège. Il n’y avait qu’une patte. Ils l’ont refermé, très vite.
- `inscription.marche` : … Charlie tenait la porte, et il riait. Derrière lui, tout ce qui vit…
- `inscription.fossoyage` : Ce que gardait la porte, un royaume, un monde, nul ne sait. Lui le savait, et cela le faisait sourire.
- `inscription.tertres` : Ici reposent ceux de sa troupe. Elle, non. Elle ne repose pas.
- `inscription.ossuaire` : Les hommes ont rangé leurs morts par milliers. Personne n’a vu passer celle qui les comptait.
- `inscription.bivouac` : Contre la porte, ils ont lancé des béliers, des feux, des prières. Il a tenu.
- `inscription.palissade` : Les pieux sont taillés à sa manière. Ceux qui les plantent ne savent plus de qui vient ce geste.
- `inscription.baliste` : Frappez la bête où qu’elle se cache. Le Soleil Blême ne compte pas les…
- `inscription.cloitre` : On souffle la chandelle en dernier, ici. Les moines savent ce qui marche dans le noir.
- `inscription.refectoire` : Tant qu’il tenait la porte, on mangeait à sa faim de ce côté-ci.
- `inscription.scriptorium` : Rature les trois noms à chaque copie. Si un nom résiste, brûle la page. Si la page résiste…
- `inscription.avenue` : … Charlie tint la porte. Plume prit la nuit des hommes. Pollen tendit les routes… Plus bas, au burin : « Martelé par ordre. Que les fils oublient. »
- `inscription.douves` : Depuis, les armées des hommes marchent sur des pièges que personne n’a posés. Et pas loin, quelqu’un boite.
- `inscription.pont_levis` : Quand la porte s’est fermée, il était encore devant. Personne ne l’a vu repartir.
- `inscription.nef` : Ils ont bâti haut et clair, pour qu’aucune ombre n’y reste. Ce n’était pas l’ombre qu’ils craignaient.
- `inscription.transept` : Le sol sonne creux. En dessous, un mécanisme armé attend depuis la vieille guerre. Un pas, un seul.
- `inscription.choeur` : Quand la porte se rouvrira, un veilleur sans nom s’y tiendra. Il aura peur. Elle lui laissera son ombre.
- `inscription.greve` : La marée monte jusqu’à ses pattes, puis redescend. Elle n’a jamais osé plus.
- `inscription.filets` : Les filets sont noués à sa façon : un nœud qui tient, un qui lâche. Les corbeaux ne savent jamais lequel.
- `inscription.epaves` : Chaque barque coulée garde une place vide à l’arrière. Personne ne l’a vue s’y asseoir.
- `inscription.ponton_noir` : Par ordre du Soleil Blême : brûlez les pontons. Ce qui ne traverse pas ne revient pas.
- `inscription.cap_corbeaux` : Les corbeaux volent en ligne, sans un cri, comme on le leur a appris. Qui le leur a appris, ils l’ont oublié.
- `inscription.eau_morte` : Il s’est assis ici pour regarder l’eau, un soir de grande fatigue. Elle n’a plus bougé depuis.
- `inscription.pontons` : Planche après planche, le ponton avance sur l’eau. Une sur trois est piégée. Une sur trois boite.
- `inscription.passe_noyes` : Le passage se paie d’une obole. Qui porte un chat paie double, et ne passe pas.
- `inscription.baie_morte` : Sous l’eau, des rouages verdis tournent sans bruit. Elle a toujours aimé les choses qui attendent.
- `inscription.naufrage` : Le navire s’est brisé contre la porte, comme tous les autres. La porte n’a pas une rayure.

## Niveaux, région 1 : Le Village Affamé

- `niveau.r1.01.nom` : La Porte Ouverte
- `niveau.r1.01.ambiance` : Les cheminées ne fument plus. Quelqu’un a laissé la porte ouverte. Avant, un autre la tenait.
- `niveau.r1.02.nom` : Le Puits Muet
- `niveau.r1.02.ambiance` : On y jetait les chats pour chasser la peste. On peut encore y entendre des échos.
- `niveau.r1.03.nom` : La Route des Pendus
- `niveau.r1.03.ambiance` : Sept cordes, six corps. La septième attend celui qui doutera.
- `niveau.r1.04.nom` : Le Carrefour du Bûcher
- `niveau.r1.04.ambiance` : Le bûcher est éteint depuis l’hiver. La cendre frémit encore.
- `niveau.r1.05.nom` : Les Chaumes Vides
- `niveau.r1.05.ambiance` : Le grain est mangé, les bêtes aussi. Qu’est-ce qu’on voit bouger, alors ?
- `niveau.r1.06.nom` : Le Gué des Corbeaux
- `niveau.r1.06.ambiance` : Les corbeaux ne crient plus. Ils attendent, comme nous.
- `niveau.r1.07.nom` : La Colline des Croix
- `niveau.r1.07.ambiance` : On a cessé de graver les noms. Il y en avait trop.
- `niveau.r1.08.nom` : La Dernière Veillée
- `niveau.r1.08.ambiance` : Un à un les feux s’éteignent. Celui du bûcher couve toujours.
- `niveau.r1.09.nom` : Le Chemin des Torches
- `niveau.r1.09.ambiance` : Ils viennent par trois routes, la fourche à la main et la faim au ventre.
- `niveau.r1.10.nom` : Vaudrelle
- `niveau.r1.10.ambiance` : L’étal est plein. Le Boucher a toujours faim.

## Niveaux, région 2 : Les Champs Brûlés

- `niveau.r2.01.nom` : Les Sillons Noirs
- `niveau.r2.01.ambiance` : La charrue est restée au bout du sillon. Le laboureur aussi.
- `niveau.r2.02.nom` : La Meule qui Fume
- `niveau.r2.02.ambiance` : Le feu couve sous la paille depuis la Saint-Jean. Il attend le vent.
- `niveau.r2.03.nom` : L’Aire de Battage
- `niveau.r2.03.ambiance` : On y battait le blé. On y bat maintenant ce qui reste.
- `niveau.r2.04.nom` : Le Chariot Brisé
- `niveau.r2.04.ambiance` : Les roues se sont arrêtées en pleine fuite. Les chevaux, on les a mangés.
- `niveau.r2.05.nom` : La Haie Calcinée
- `niveau.r2.05.ambiance` : Même les haies ont brûlé. Il n’y a plus d’ombre pour se cacher.
- `niveau.r2.06.nom` : Le Champ des Gerbes
- `niveau.r2.06.ambiance` : Les gerbes sont noires, les épis creux. La faim est la seule récolte qui ne manque pas.
- `niveau.r2.07.nom` : Le Gué des Cendres
- `niveau.r2.07.ambiance` : Le ruisseau charrie de la suie. Qui y boit ne chante plus.
- `niveau.r2.08.nom` : L’Épouvantail du Sud
- `niveau.r2.08.ambiance` : On l’a planté pour les corbeaux. Il regarde les chats, maintenant.
- `niveau.r2.09.nom` : La Grange Rouge
- `niveau.r2.09.ambiance` : Elle brûle depuis trois jours. Avant, on y laissait du lait, la nuit.
- `niveau.r2.10.nom` : La Faim
- `niveau.r2.10.ambiance` : Elle marche sur les champs morts. Chacun de ses pas affame la terre.

## Niveaux, région 3 : Le Bourg des Bûchers

- `niveau.r3.01.nom` : La Porte du Bourg
- `niveau.r3.01.ambiance` : La herse est levée. On n’entre pas ici sans être jugé.
- `niveau.r3.02.nom` : Les Ruelles Étroites
- `niveau.r3.02.ambiance` : Les maisons se penchent les unes vers les autres. On jurerait les voir bouger.
- `niveau.r3.03.nom` : La Place du Bûcher
- `niveau.r3.03.ambiance` : Le bois est empilé depuis l’aube. Il ne manque qu’une sorcière.
- `niveau.r3.04.nom` : Le Marché aux Fagots
- `niveau.r3.04.ambiance` : Les fagots se vendent mieux que le pain. Tout le monde sait pourquoi.
- `niveau.r3.05.nom` : La Rue des Délateurs
- `niveau.r3.05.ambiance` : Un volet claque. On vous a vu. On vous a déjà dénoncé.
- `niveau.r3.06.nom` : Le Beffroi Fendu
- `niveau.r3.06.ambiance` : La cloche sonne les condamnations. Elle est fendue, mais elle sonne encore.
- `niveau.r3.07.nom` : L’Échafaud du Juge
- `niveau.r3.07.ambiance` : Le bois est neuf, les marches sont usées.
- `niveau.r3.08.nom` : La Cour des Torches
- `niveau.r3.08.ambiance` : Chaque fenêtre a sa torche. Chaque torche attend un chat.
- `niveau.r3.09.nom` : Le Quartier Brûlé
- `niveau.r3.09.ambiance` : Ce qui n’a pas brûlé hier brûlera demain. Le bourg avance par le feu.
- `niveau.r3.10.nom` : Le Juge des Flammes
- `niveau.r3.10.ambiance` : Il lit la sentence avant le procès, et il allume avant la sentence.

## Niveaux, région 4 : Les Marais de l’Ordalie

- `niveau.r4.01.nom` : Le Ponton Pourri
- `niveau.r4.01.ambiance` : Les planches cèdent une à une. Celle qui tient est celle qu’on ne voit pas.
- `niveau.r4.02.nom` : L’Étang Noir
- `niveau.r4.02.ambiance` : On y jette les accusées : si elles coulent, elles sont innocentes.
- `niveau.r4.03.nom` : Les Saules Penchés
- `niveau.r4.03.ambiance` : Les saules pleurent sur l’eau. L’eau ne se trouble pas.
- `niveau.r4.04.nom` : La Barque Échouée
- `niveau.r4.04.ambiance` : Le passeur est parti. La barque l’attend, la coque pleine d’eau.
- `niveau.r4.05.nom` : Le Gué des Noyeurs
- `niveau.r4.05.ambiance` : Une main sort de l’eau. Elle n’est pas là pour aider.
- `niveau.r4.06.nom` : Les Roseaux Murmurants
- `niveau.r4.06.ambiance` : Le vent y dit des noms : ceux qui n’ont pas flotté.
- `niveau.r4.07.nom` : Le Marais des Feux Follets
- `niveau.r4.07.ambiance` : Les lueurs guident les voyageurs. Surtout vers le fond.
- `niveau.r4.08.nom` : La Chapelle Engloutie
- `niveau.r4.08.ambiance` : Son clocher dépasse de l’eau. Sous la vase, on l’entend sonner parfois.
- `niveau.r4.09.nom` : Le Pèlerinage
- `niveau.r4.09.ambiance` : Voilés, ils marchent vers le puits sans lever la tête. Aucun n’en revient.
- `niveau.r4.10.nom` : Le Puits Noir
- `niveau.r4.10.ambiance` : Elle n’est plus tout à fait femme, ni tout à fait eau. Elle attend ses chats.

## Niveaux, région 5 : La Ville Pestiférée

- `niveau.r5.01.nom` : La Porte Murée
- `niveau.r5.01.ambiance` : On a muré la porte de l’extérieur, pour que la peste ne sorte pas.
- `niveau.r5.02.nom` : La Quarantaine
- `niveau.r5.02.ambiance` : Une croix rouge sur chaque porte. Ce qui est derrière n’est plus compté.
- `niveau.r5.03.nom` : Le Faubourg Vide
- `niveau.r5.03.ambiance` : Les cloches ne sonnent plus les morts. Il y en a trop, et personne pour sonner.
- `niveau.r5.04.nom` : La Rue des Rats
- `niveau.r5.04.ambiance` : Ils courent en rangs serrés, comme s’ils avaient reçu un ordre. C’est le cas.
- `niveau.r5.05.nom` : Le Marché Muet
- `niveau.r5.05.ambiance` : Les étals sont couverts de linceuls. Plus personne n’achète, plus personne ne vend.
- `niveau.r5.06.nom` : La Fosse Commune
- `niveau.r5.06.ambiance` : Elle est pleine. On creuse la suivante avant d’avoir fini de remplir celle-ci.
- `niveau.r5.07.nom` : L’Hôpital des Fous
- `niveau.r5.07.ambiance` : Le médecin porte un masque à bec. Il soigne tout le monde, sauf nous.
- `niveau.r5.08.nom` : La Place des Cadavres
- `niveau.r5.08.ambiance` : Les charrettes passent chaque nuit. Elles repartent toujours pleines.
- `niveau.r5.09.nom` : Le Dernier Quartier
- `niveau.r5.09.ambiance` : Les derniers vivants ont barricadé leurs portes. Les rats passent par les murs.
- `niveau.r5.10.nom` : La Mère des Rats
- `niveau.r5.10.ambiance` : Sous la ville, elle pond. La peste n’a jamais été un accident.

## Niveaux, région 6 : Le Charnier

- `niveau.r6.01.nom` : Le Fossoyage
- `niveau.r6.01.ambiance` : On creuse plus vite qu’on ne prie. Les pelles ne se reposent jamais.
- `niveau.r6.02.nom` : Les Tertres Frais
- `niveau.r6.02.ambiance` : La terre est encore meuble. Quelque chose a poussé dedans, et ce n’est pas du blé.
- `niveau.r6.03.nom` : L’Ossuaire Ouvert
- `niveau.r6.03.ambiance` : Les crânes sont rangés par ordre de taille. Quelqu’un a commencé à les compter.
- `niveau.r6.04.nom` : Le Charnier des Pestiférés
- `niveau.r6.04.ambiance` : Les premiers y dorment depuis longtemps. Les suivants n’ont pas fini de tomber.
- `niveau.r6.05.nom` : La Veillée des Creux
- `niveau.r6.05.ambiance` : Ils se relèvent sans rien demander. La terre n’a pas voulu d’eux.
- `niveau.r6.06.nom` : Le Chant des Chauves-Souris
- `niveau.r6.06.ambiance` : Elles nichent dans les côtes. Au crépuscule, tout le charnier se met à battre des ailes.
- `niveau.r6.07.nom` : La Croix Penchée
- `niveau.r6.07.ambiance` : Chaque croix penche vers le centre, comme pour entendre ce qu’on y murmure.
- `niveau.r6.08.nom` : Les Arbres Pendus
- `niveau.r6.08.ambiance` : Les branches portent des os en guise de fruits. Personne n’ose les cueillir.
- `niveau.r6.09.nom` : Le Mausolée Fendu
- `niveau.r6.09.ambiance` : Une fente dans la pierre, assez large pour laisser passer un roi.
- `niveau.r6.10.nom` : Le Roi des Fosses
- `niveau.r6.10.ambiance` : Il règne sur ceux qu’on a enterrés trop vite. Il compte ses sujets, et il en manque.

## Niveaux, région 7 : La Croisade

- `niveau.r7.01.nom` : Le Camp des Croisés
- `niveau.r7.01.ambiance` : Les tentes sont encore dressées, les feux éteints, les armes à leur place. Les hommes, non.
- `niveau.r7.02.nom` : La Route des Lances
- `niveau.r7.02.ambiance` : Des lances plantées en bordure, à intervalles réguliers. Le vent y accroche des lambeaux de bannières.
- `niveau.r7.03.nom` : La Charge Oubliée
- `niveau.r7.03.ambiance` : Les sabots ont labouré la plaine. Les chevaux reviennent, parfois, sans leurs cavaliers.
- `niveau.r7.04.nom` : Le Bivouac des Bannières
- `niveau.r7.04.ambiance` : Chaque bannière porte une croix. Aucune ne dit au nom de qui.
- `niveau.r7.05.nom` : La Palissade
- `niveau.r7.05.ambiance` : On a taillé des pieux dans les églises voisines. Dieu a prêté son bois.
- `niveau.r7.06.nom` : La Baliste Brisée
- `niveau.r7.06.ambiance` : Elle a tiré une dernière fois, sur son propre camp. Un ressort avait été changé.
- `niveau.r7.07.nom` : Le Chariot d’Armes
- `niveau.r7.07.ambiance` : Il roule seul vers le front. Plus personne ne le suit, mais il est toujours plein.
- `niveau.r7.08.nom` : Le Serment sur l’Épée
- `niveau.r7.08.ambiance` : Ils ont juré sur l’acier. L’acier, lui, n’a rien promis.
- `niveau.r7.09.nom` : La Dernière Messe de Camp
- `niveau.r7.09.ambiance` : Le prêtre a béni l’armée avant de la maudire. Les cloches de campagne sonnent encore.
- `niveau.r7.10.nom` : Le Prince Croisé
- `niveau.r7.10.ambiance` : Il a marché vers l’est pour sauver des âmes. Il en ramène une armée, et pas une à sauver.

## Niveaux, région 8 : Le Monastère Noir

- `niveau.r8.01.nom` : La Porte du Monastère
- `niveau.r8.01.ambiance` : Elle est close de l’intérieur. Personne n’a su dire de quoi l’on se protégeait.
- `niveau.r8.02.nom` : Le Cloître Silencieux
- `niveau.r8.02.ambiance` : Quarante moines, un seul vœu : ne plus parler. Un seul le tient encore.
- `niveau.r8.03.nom` : Les Pénitents
- `niveau.r8.03.ambiance` : Ils se frappent jusqu’à ne plus rien sentir. Puis ils frappent les autres.
- `niveau.r8.04.nom` : Le Réfectoire Noir
- `niveau.r8.04.ambiance` : Les tables sont dressées pour un banquet de jeûne. Les bols sont pleins de cendre.
- `niveau.r8.05.nom` : La Fontaine Noire
- `niveau.r8.05.ambiance` : L’eau de la vasque reflète certains qui s’y penchent. Pas tous.
- `niveau.r8.06.nom` : Le Scriptorium
- `niveau.r8.06.ambiance` : On y copiait la Parole. Maintenant, on y rature les noms.
- `niveau.r8.07.nom` : La Cellule des Aveux
- `niveau.r8.07.ambiance` : Les murs sont gravés de noms. Aucun n’a signé de plein gré.
- `niveau.r8.08.nom` : Le Clocher Muet
- `niveau.r8.08.ambiance` : La cloche a été fondue en chaînes. Le clocher sonne pourtant, sans rien pour le dire.
- `niveau.r8.09.nom` : La Chambre d’Exorcisme
- `niveau.r8.09.ambiance` : On y chasse les démons. Il faut bien que quelqu’un les y mette d’abord.
- `niveau.r8.10.nom` : Le Grand Inquisiteur
- `niveau.r8.10.ambiance` : Il a lu chaque confession, chaque pensée. Il connaît déjà la vôtre.

## Niveaux, région 9 : La Cité du Roi

- `niveau.r9.01.nom` : La Porte de la Cité
- `niveau.r9.01.ambiance` : Les gardes saluent ceux qui entrent. Ils ne disent rien à ceux qui voudraient sortir.
- `niveau.r9.02.nom` : L’Avenue des Statues
- `niveau.r9.02.ambiance` : Le roi s’est fait sculpter cent fois. Les trois socles du bout sont plus vieux que lui.
- `niveau.r9.03.nom` : Les Douves Sombres
- `niveau.r9.03.ambiance` : On y a jeté les dettes, les rivaux et les poètes. L’eau n’a rien oublié.
- `niveau.r9.04.nom` : La Herse Brisée
- `niveau.r9.04.ambiance` : Elle est tombée un jour de fête. Le roi a ri, paraît-il.
- `niveau.r9.05.nom` : Le Pont-Levis
- `niveau.r9.05.ambiance` : Il se baisse pour les amis du roi. Il n’en reste plus beaucoup.
- `niveau.r9.06.nom` : La Fontaine Royale
- `niveau.r9.06.ambiance` : Certains soirs, elle coule du vin. Ces soirs-là, le vin est trop rouge.
- `niveau.r9.07.nom` : La Cour des Arbalétriers
- `niveau.r9.07.ambiance` : Ils visent les fenêtres, par habitude. Ou par ordre.
- `niveau.r9.08.nom` : La Galerie des Chevaliers
- `niveau.r9.08.ambiance` : Les armures montent la garde, vides. Il y en a une de plus chaque nuit.
- `niveau.r9.09.nom` : La Salle du Trône
- `niveau.r9.09.ambiance` : Le trône est couvert de poussière. Le roi préfère rester debout.
- `niveau.r9.10.nom` : Le Roi Fou
- `niveau.r9.10.ambiance` : Il parle à sa couronne, et elle lui répond. Elle conseille toujours la guerre.

## Niveaux, région 10 : La Cathédrale du Soleil Blême

- `niveau.r10.01.nom` : Le Parvis de Cendre
- `niveau.r10.01.ambiance` : Il neige de la cendre, sans qu’aucun feu n’ait brûlé. Le ciel est devenu pâle.
- `niveau.r10.02.nom` : La Nef Brisée
- `niveau.r10.02.ambiance` : Les piliers tiennent encore, par habitude. La voûte, elle, a renoncé.
- `niveau.r10.03.nom` : Le Chemin des Acolytes
- `niveau.r10.03.ambiance` : Ils marchent en procession vers un autel qu’ils n’ont jamais vu. Ils y croient pourtant.
- `niveau.r10.04.nom` : Les Vitraux Pâles
- `niveau.r10.04.ambiance` : Les saints ont perdu leurs couleurs. Ils regardent tous le même point du ciel.
- `niveau.r10.05.nom` : Le Transept
- `niveau.r10.05.ambiance` : Deux bras de pierre s’ouvrent en croix. Le sol, en dessous, sonne creux.
- `niveau.r10.06.nom` : La Statue sans Tête
- `niveau.r10.06.ambiance` : Un ange sans tête ouvre les ailes. On dit qu’il guette un visage à prendre.
- `niveau.r10.07.nom` : L’Escalier des Anges
- `niveau.r10.07.ambiance` : Les marches sont couvertes de plumes grises. Elles montent plus vite que ceux qui les gravissent.
- `niveau.r10.08.nom` : Le Chœur Éteint
- `niveau.r10.08.ambiance` : Les stalles sont vides. Un chant s’élève pourtant, très haut, très pâle.
- `niveau.r10.09.nom` : L’Autel de Cendre
- `niveau.r10.09.ambiance` : On n’y offre plus rien. Il prend ce qu’il veut, sans demander.
- `niveau.r10.10.nom` : Le Soleil Blême
- `niveau.r10.10.ambiance` : Il ne se lève plus, il pâlit. Sous sa lumière, tout ressemble déjà à de la cendre.

## Après l’histoire, région 11 : Les Grèves Grises

Textes de la région 11 (niveaux 101 à 110, spec `docs/specs/2026-11-08-apres-histoire-gimmicks.md`), à retoucher.
Les niveaux 101 à 105 sont ceux du Vol de Corbeaux, 106 à 110 ceux du Radeau. La clé region.11.ambiance (sans accents
graves) est une proposition : aucune région n’a encore d’ambiance affichée, `npm run lore` la laisse de côté.

- `region.11` : Les Grèves Grises
- region.11.ambiance : Derrière la cathédrale, la cendre descend jusqu’à l’eau. Les corbeaux y attendent. Un passeur aussi, la main ouverte.
- `niveau.r11.01.nom` : La Grève de Cendre
- `niveau.r11.01.ambiance` : La cendre descend jusqu’à l’eau. L’eau ne l’emporte pas.
- `niveau.r11.02.nom` : Les Filets Pendus
- `niveau.r11.02.ambiance` : Les pêcheurs ont laissé leurs filets. Les corbeaux comptent ce qui s’y est pris.
- `niveau.r11.03.nom` : Le Vol Bas
- `niveau.r11.03.ambiance` : Ils rasent la grève sans un cri. On n’entend que les ailes, et c’est déjà trop tard.
- `niveau.r11.04.nom` : La Coque Retournée
- `niveau.r11.04.ambiance` : Une barque sur le dos, comme une bête morte. Quelque chose gratte encore dessous.
- `niveau.r11.05.nom` : Le Perchoir
- `niveau.r11.05.ambiance` : Un arbre sans feuilles, noir de plumes. Quand il s’envole, le ciel s’éteint.
- `niveau.r11.06.nom` : L’Embarcadère
- `niveau.r11.06.ambiance` : Le ponton s’arrête au milieu de l’eau. Le reste du chemin se paie.
- `niveau.r11.07.nom` : Le Radeau
- `niveau.r11.07.ambiance` : Des planches liées avec des cordes de pendus. Elles flottent mieux que ceux qui les portaient.
- `niveau.r11.08.nom` : Les Eaux sans Fond
- `niveau.r11.08.ambiance` : Ni courant, ni fond. Le radeau avance pourtant, et personne ne rame.
- `niveau.r11.09.nom` : Le Gué des Oboles
- `niveau.r11.09.ambiance` : Une pièce sur chaque pierre du gué. Personne n’est revenu les reprendre.
- `niveau.r11.10.nom` : Le Passeur
- `niveau.r11.10.ambiance` : Il attend sur la grève, la main ouverte. Ce qu’on lui donne ne revient pas.

## Objets

- `objet.fiole_soufre` : Fiole de Soufre
- `objet.fiole_soufre.desc` : Elle sent l’enfer des autres.
- `objet.herbe_sabbat` : Herbe de Sabbat
- `objet.herbe_sabbat.desc` : Cueillie la nuit sur une tombe fraîche. Elle rend cinq vies.
- `objet.griffe_renfort` : Griffe de Renfort
- `objet.griffe_renfort.desc` : Trop lourde pour une patte ordinaire. Un chat vient la réclamer quand même.
- `objet.sablier` : Sablier
- `objet.sablier.desc` : Le temps s’arrête cinq souffles. Seuls les grands le traversent.

## Collection : apparences et familiers

- `collection.skin_caserne_1` : Grenier de Paille
- `collection.skin_caserne_1.desc` : Le foin garde la chaleur des bêtes parties.
- `collection.skin_caserne_2` : Grenier Calciné
- `collection.skin_caserne_2.desc` : Il a brûlé deux fois. Les murs s’en souviennent.
- `collection.skin_caserne_3` : Grenier des Veilleurs
- `collection.skin_caserne_3.desc` : On y a veillé neuf nuits sans fermer l’œil, ni la porte.
- `collection.skin_tir_1` : Clocher de Suie
- `collection.skin_tir_1.desc` : La cloche est fêlée, le tir reste droit.
- `collection.skin_tir_2` : Clocher Givré
- `collection.skin_tir_2.desc` : Le froid d’hiver rend la vue plus claire.
- `collection.skin_tir_3` : Clocher des Corbeaux
- `collection.skin_tir_3.desc` : Les corbeaux guident la flèche. Ils ont l’habitude des corps.
- `collection.skin_magie_1` : Autel de Cendre Grise
- `collection.skin_magie_1.desc` : Il ne reste que la cendre, et elle écoute.
- `collection.skin_magie_2` : Autel des Fiévreux
- `collection.skin_magie_2.desc` : Les malades y ont prié. Quelque chose a répondu.
- `collection.skin_magie_3` : Autel Sans Nom
- `collection.skin_magie_3.desc` : Trois noms y étaient gravés. On a gratté jusqu’à la pierre nue.
- `collection.skin_artillerie_1` : Rempart Rouillé
- `collection.skin_artillerie_1.desc` : Le fer pleure sur la pierre.
- `collection.skin_artillerie_2` : Rempart de Charbon
- `collection.skin_artillerie_2.desc` : Noirci par les bûchers, il tient encore.
- `collection.skin_artillerie_3` : Rempart du Dernier Siège
- `collection.skin_artillerie_3.desc` : Il a vu tomber les autres. Pas celui-ci.
- `collection.skin_plume` : Manteau d’Ombre
- `collection.skin_plume.desc` : Cousu pour celle qui a laissé son ombre. Nielle le porte à l’envers, par respect.
- `collection.skin_charlie` : Pelage de Braise
- `collection.skin_charlie.desc` : La couleur d’une porte tenue au soleil. Gond la porte avec fierté.
- `collection.skin_pollen` : Patte de Fer
- `collection.skin_pollen.desc` : Une patte de fer pour honorer celle qui manque. Clopin boite quand même.
- `collection.skin_suie` : Collier de Cendre
- `collection.skin_suie.desc` : Chaque grain est un bûcher que Suie a vu.
- `collection.skin_corbeau` : Pennes d’Encre
- `collection.skin_corbeau.desc` : Elles servaient à écrire les condamnations.
- `collection.skin_mastoc` : Peau de Loup
- `collection.skin_mastoc.desc` : Le dernier loup du village s’est couché pour de bon.
- `collection.skin_brise_os` : Crocs Rouges
- `collection.skin_brise_os.desc` : Ils ne sont pas teints. Ils ont servi.
- `collection.skin_rouage` : Cuir Huilé
- `collection.skin_rouage.desc` : Chaque couture a sa petite machine. Le patron vient d’une boiteuse.
- `collection.skin_lanterne` : Lanterne Veuve
- `collection.skin_lanterne.desc` : Sa flamme brûle pour quelqu’un qui n’est plus là.
- `collection.familier_rat` : Rate Boiteuse
- `collection.familier_rat.desc` : Elle suit le chat qui ne l’a pas mangée. Elle boite du même côté que lui.
- `collection.familier_crapaud` : Crapaud du Puits
- `collection.familier_crapaud.desc` : Il est remonté seul. Il ne dit pas d’où.
- `collection.familier_escargot` : Escargot Pèlerin
- `collection.familier_escargot.desc` : Il arrivera. Il arrive toujours.
- `collection.familier_chouette` : Chouette Aveugle
- `collection.familier_chouette.desc` : Elle n’a pas besoin d’yeux. Elle entend passer ce qui ne fait pas de bruit.
- `collection.familier_luciole` : Luciole des Marais
- `collection.familier_luciole.desc` : Une petite lueur qui refuse de s’éteindre.
- `collection.familier_lezard` : Lézard de Cendre
- `collection.familier_lezard.desc` : Il dort sur les braises et s’y réchauffe.
- `collection.familier_chauve_souris` : Chauve-Souris du Charnier
- `collection.familier_chauve_souris.desc` : Elle connaît le chemin des fosses.
- `collection.familier_araignee` : Araignée Tisseuse
- `collection.familier_araignee.desc` : Elle recoud ce que la peste a déchiré.
- `collection.familier_furet` : Furet de la Dîme
- `collection.familier_furet.desc` : Il prélève sa part sur tout ce qui passe.
- `collection.familier_corneille` : Corneille Borgne
- `collection.familier_corneille.desc` : L’œil qui manque voit de l’autre côté.
- `collection.familier_papillon_nuit` : Papillon de Nuit
- `collection.familier_papillon_nuit.desc` : Il vole vers les flammes que tout le monde fuit.
- `collection.familier_salamandre` : Salamandre du Bûcher
- `collection.familier_salamandre.desc` : Née du premier bûcher, le soir où la porte s’est rouverte. Elle n’a jamais connu le froid.

## Fin de campagne

- `campagne.fin_titre` : Les Cendres Retombent
- `campagne.fin_illustration` : Le Dernier Veilleur sur les marches de la cathédrale, devant le Soleil Blême éteint.
- `campagne.fin_p1` : Le Soleil Blême s’éteint sur la cathédrale. Ni cri ni triomphe : de la cendre qui retombe sur les dalles, et au loin les cloches qui se taisent une à une.
- `campagne.fin_p2` : Les bûchers ne sont plus que des braises. Quelque part, une porte grince et ne se referme pas tout à fait. Dans les granges reviennent des pas feutrés : une ombre qui n’est à personne, un ronronnement derrière une porte, un pas qui boite. Personne ne dit leurs noms. Le Dernier Veilleur reste à la porte.
- `campagne.fin_p3` : Les hommes oublieront. Les rats reviendront. Mais tant qu’une braise veille quelque part, la nuit n’est pas finie.

## Phrases de fin de partie

- `fin.victoire_detail` : Les braises tiennent encore.
- `fin.defaite_detail` : Le Soleil Blême gagne cette nuit.
- `fin.infini_titre` : La nuit t’a rattrapé
- `fin.infini_detail` : Les vagues ne finissent jamais, seuls les veilleurs s’arrêtent.
