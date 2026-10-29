# Lore de Pocharlume

Tous les textes narratifs du jeu, regroupés. Modifie librement le texte après les deux-points ; garde la clé
entre accents graves (`…`) intacte, c'est elle qui dit où va le texte dans le jeu. Tu peux aussi ajouter des
paragraphes libres (idées, corrections d'univers) : ils seront reportés dans la spec et dans les textes concernés.

Ton voulu (spec) : entièrement sombre, textes courts et cryptiques, violence suggérée, jamais drôle, PEGI 12.

Les trois dieux ne sont plus des héros (spec `docs/specs/2026-10-29-dieux-sans-visage.md`) : ils ne sont jamais
incarnés ni dessinés. On ne les devine que par allusions, dans les descriptions des tours, des héros, des sorts,
des objets, des apparences et des niveaux, et dans les inscriptions des vieilles statues cachées sur chaque carte.
Partout, on ne les désigne que par des épithètes ; leurs vrais noms ne sont gravés qu'une seule fois, sur une seule
statue (`inscription.avenue`). Les héros `heros.plume`, `heros.charlie` et `heros.pollen` sont désormais trois
fidèles mortels, un par dieu. Les clés techniques ne changent pas.

Pas encore dans le jeu : les inscriptions des statues, les paroles avant les boss et la description des ennemis.
Elles sont écrites plus bas.

## Univers (source : la spec)
C'est l'**An de la Grande Mort**. L'Église du **Soleil Blême** a déclaré les chats serviteurs des sorcières :
on les brûle avec elles sur les bûchers, on les mange quand la famine vient, on les jette au puits pour conjurer la
peste. Et plus les chats meurent, plus les rats prolifèrent, et plus la peste tue. Personne ne fait le lien.

Bien avant l'Église, trois **Chats Suprêmes** étaient priés dans les granges et les cryptes. On leur laissait du
lait dans le noir, et le grain restait au grenier. Ils ont brûlé sur le **Premier Bûcher**, l'Église a gratté leurs
noms de la pierre, et il ne reste d'eux que des braises et des statues qu'on ne regarde plus. Le joueur est **le
Dernier Veilleur**, un chat sans nom qui ranime ces braises et rassemble les survivants, région après région,
jusqu'à la cathédrale où le Soleil Blême attend.

Personne ne sait plus à quoi ils ressemblaient. Il reste des épithètes, qui changent d'un village à l'autre :
- **L'Ombre**, Celle qui n'a pas de reflet, la Silencieuse : on dit qu'elle a donné son reflet pour que les
  chasseurs ne la voient plus. Ombre, silence, absence, furtivité.
- **Le Colosse**, Celui qui tient la porte, l'Obstiné : on dit qu'il a tenu seul une porte neuf nuits contre les
  torches, sans comprendre pourquoi il devait s'arrêter. Masse, poids, obstination.
- **Trois-Pattes**, Celle qui a laissé sa patte, la Boiteuse : on dit qu'un piège à loup a gardé sa patte, mais que ses
  pièges à elle ont prit des vies. Ingéniosité, ressorts, mécanismes.

Trois fidèles portent encore leur souvenir : **Nielle**, qui voile les miroirs pour l'Ombre ; **Gond**, qui dort
contre les portes pour le Colosse ; **Clopin**, qui boite en mémoire de Trois-Pattes.

Les textes sont courts et cryptiques : descriptions d'objets, inscriptions des statues, murmures avant chaque
boss. Rien n'est drôle. La violence est suggérée (fumée, silhouettes, cendres) et jamais montrée en gros plan, pour
rester publiable sur le Play Store (classement PEGI 12 visé).

## Les trois dieux

Ce qu'on voit au choix avant un niveau : un symbole, une épithète, une phrase. Jamais de visage.

- `dieu.plume` : L’Ombre
- `dieu.plume.desc` : Celle qui n’a pas de reflet. Ceux qu’elle regarde ne la voit pas.
- `dieu.charlie` : Le Colosse
- `dieu.charlie.desc` : Celui qui tient la porte. Il tiendra. Toujours.
- `dieu.pollen` : Trois-Pattes
- `dieu.pollen.desc` : La doyenne, plus rusée que tous. Un piège a gardé sa patte, elle a gardé leurs pièges.

## Héros

- `heros.plume` : Nielle, Voile-Miroirs
- `heros.plume.role` : Duelliste, esquive et critiques
- `heros.plume.desc` : Elle a voilé tous les miroirs du hameau. Une façon de prier une ancienne divinité parait-il.
- `heros.suie` : Suie
- `heros.suie.role` : Assassin, exécute les blessés
- `heros.suie.desc` : Elle sent le brûlé. Ce qu’elle touche ne repart pas.
- `heros.corbeau` : Corbeau
- `heros.corbeau.role` : Tireur, perce l’armure
- `heros.corbeau.desc` : Il attend sur les toits que les cris s’éteignent.
- `heros.charlie` : Gond, le Portier
- `heros.charlie.role` : Tank, frappe de zone qui étourdit
- `heros.charlie.desc` : Il dort adossé aux portes. Aucune ne s’est encore ouverte derrière lui.
- `heros.mastoc` : Mastoc
- `heros.mastoc.role` : Provocation, bloque trois ennemis
- `heros.mastoc.desc` : Il a mangé tant de coups qu’ils lui reviennent par habitude.
- `heros.brise_os` : Brise-Os
- `heros.brise_os.role` : Berserker, plus fort blessé
- `heros.brise_os.desc` : Il ne sait plus à qui est le sang. Cela aide.
- `heros.pollen` : Clopin, le Tendeur
- `heros.pollen.role` : Pose des pièges, tire à la fronde
- `heros.pollen.desc` : Il boite comme on prie. Là où il passe, la terre apprend à mordre.
- `heros.rouage` : Rouage
- `heros.rouage.role` : Ingénieur, construit une tourelle
- `heros.rouage.desc` : Le chat qui parlait aux oreilles des ressorts.
- `heros.lanterne` : Lanterne
- `heros.lanterne.role` : Soigneur, magie à distance
- `heros.lanterne.desc` : Une flamme sans mèche. Elle éclaire ceux qui doivent rester debout.
- `heros.titre` : Héros
- `heros.fermer` : Fermer
- `heros.reinitialiser` : Reprendre les points
- `heros.verrouille` : Pas encore recruté
- `heros.ultime` : Ultime
- `heros.plus` : +
- `heros.confirmer` : Recruter
- `heros.annuler` : Annuler

## Sorts des dieux

- `sort.voile_de_nuit` : Voile de Nuit
- `sort.voile_de_nuit.desc` : La Silencieuse tire la nuit sur le jour. Les pas s’alourdissent, les flèches trouvent la gorge.
- `sort.griffes_d_ombre` : Griffes d’Ombre
- `sort.griffes_d_ombre.desc` : Ce qui est de chair ne se relève pas. Ce qui est plus que chair se souvient d’elle.
- `sort.chute_du_colosse` : Chute du Colosse
- `sort.chute_du_colosse.desc` : Le sol se souvient d’un poids. Il ne dit pas lequel.
- `sort.renforts` : Renforts
- `sort.renforts.desc` : Deux gros matous sortent de la grange, dos à la porte. Aucun ne dit pour qui.
- `sort.pieges_a_ressort` : Pièges à Ressort
- `sort.pieges_a_ressort.desc` : Trois mâchoires dans la poussière. 
- `sort.ingeniosite` : Ingéniosité
- `sort.ingeniosite.desc` : Un peu d’os, beaucoup de ruse. Les machines voisines tournent comme la Boiteuse l’aurait voulu.

## Compétences des héros

- `comp.pas_de_velours` : Pas de velours
- `comp.pas_de_velours.desc` : Elle marche comme on lui a appris : sans bruit, sans reflet.
- `comp.griffe_fantome` : Griffe fantôme
- `comp.griffe_fantome.desc` : Elle frappe là où l’on ne regardait pas.
- `comp.reflet_vendu` : Miroir voilé
- `comp.reflet_vendu.desc` : Elle n’a pas vendu son reflet. Elle le cache, en attendant.
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
- `comp.poigne_de_fer.desc` : Il tient comme on le lui a montré, sans savoir lâcher.
- `comp.peau_epaisse` : Peau épaisse
- `comp.peau_epaisse.desc` : Il a dormi contre des portes chaudes. Sa peau s’en souvient.
- `comp.onde_de_choc` : Onde de choc
- `comp.onde_de_choc.desc` : Le coup continue après le coup.
- `comp.neuf_nuits` : Dixième nuit
- `comp.neuf_nuits.desc` : Un autre a tenu neuf nuits. Il tiendra la dixième.
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
- `comp.ressorts_rouilles.desc` : Il les déterre sous les vieilles granges. Ils étaient armés pour lui.
- `comp.fronde_tordue` : Fronde tordue
- `comp.fronde_tordue.desc` : Elle vise mal, et touche quand même.
- `comp.trois_pattes` : Pas boiteux
- `comp.trois_pattes.desc` : Il boite par respect. Les coups ne savent plus où viser.
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
- `tour.atelier_boiteux` : Atelier Boiteux
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
- `ennemi.juge_flammes.desc` : Il a jugé le Premier Bûcher. Il en parle encore avec tendresse.
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
- `ennemi.fantassin.desc` : Il a quitté son champ pour une croix. Il ne sait plus lequel il défend.
- `ennemi.porte_banniere.desc` : Tant que la bannière flotte, ils ne reculent pas. Elle est cousue de suaires.
- `ennemi.cavalier.desc` : Le cheval connaît la route. Le cavalier ne regarde plus.
- `ennemi.prince_croise.desc` : Il a béni chaque lame de sa main. Les siens sont tombés quand même.
- `ennemi.flagellant.desc` : Il se frappe pour expier. Il frappe les autres pour les aider.
- `ennemi.inquisiteur.desc` : Il connaît la question. La réponse n’a jamais changé l’issue.
- `ennemi.exorciste.desc` : Il chasse les démons à l’eau bénite. Le démon, c’est toujours un chat.
- `ennemi.grand_inquisiteur.desc` : Il a gratté trois noms de la pierre. Il les entend encore la nuit.
- `ennemi.garde_royal.desc` : Il garde une porte qui ne mène qu’à la folie du roi.
- `ennemi.arbaletrier_elite.desc` : Il tire avant l’ordre. On ne le lui reproche jamais.
- `ennemi.chevalier.desc` : L’armure avance seule depuis longtemps. Elle se souvient d’avoir eu un homme.
- `ennemi.roi_fou.desc` : Il a fait sculpter cent statues de lui. Il n’en a abattu que trois autres.
- `ennemi.acolyte_cendre.desc` : Il chante une prière pâle. Sa voix tombe en cendre avant de finir.
- `ennemi.ange_cendre.desc` : Ses ailes sont faites de ce qui a brûlé. Il en a de très grandes.
- `ennemi.soleil_bleme.desc` : Il n’éclaire pas. Il pâlit ce qu’il regarde, jusqu’à la cendre.

## Paroles avant les boss

Ce ne sont plus les dieux qui parlent : un murmure, une inscription, une voix sans source.

- `boss.r1.parole` : Gravé sur l’étal, sous le sang sec : « Ici, on pesait les chats. La balance penche encore. »
- `boss.r2.parole` : Le vent dans les gerbes creuses : « Elle a tout mangé. Il reste celui qui veille. »
- `boss.r3.parole` : Un murmure sous les fagots : « Le premier était plus grand. Celui-ci n’en est que l’écho. »
- `boss.r4.parole` : Une voix sous l’eau, sans bouche : « Elle non plus n’a jamais coulé. Ne lui demande pas pourquoi. »
- `boss.r5.parole` : Gratté dans le mur d’une cave : « Ils ont brûlé ceux qui gardaient le grain. Les rats s’en souviennent. »
- `boss.r6.parole` : Une voix qui monte des fosses : « Il compte ses morts. Ne lui donne pas ton nom. »
- `boss.r7.parole` : Brodé sur une bannière déchirée : « Pour la Croix et le Soleil. » Dessous, plus ancien : « Pour la porte. »
- `boss.r8.parole` : Une voix qui ne vient d’aucune cellule : « Il a tout lu. Sauf ce qu’on n’a jamais écrit. »
- `boss.r9.parole` : Sous le trône, à demi effacé : « La couronne parle. Les statues… se taisent pour toi. »
- `boss.r10.parole` : Personne ne parle. Seulement, très bas : « Garde tes braises dans l’ombre. Il ne voit pas ce qui n’a pas de reflet. »

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

## Inscriptions des statues

Une vieille statue par carte. Répartition (pour la relecture, rien de cela n’est affiché) : l’Ombre (gue, aire,
ruelles, etang, ossuaire, cloitre, nef, choeur), le Colosse (chaumes, meules, beffroi, marche, fossoyage, bivouac,
refectoire, pont_levis), Trois-Pattes (carrefour, sillons, ponton, faubourg, tertres, palissade, douves, transept),
l’Église du Soleil Blême (pendus, place, saules, quarantaine, baliste, scriptorium, avenue). Seule l’inscription de
l’Avenue porte les vrais noms.

- `inscription.chaumes` : À Celui qui tient la porte. Tant qu’il tient, le grain reste au grenier, et le rat dehors.
- `inscription.gue` : Ne cherche pas son visage dans l’eau. Elle n’y est pas. Elle n’y a jamais été.
- `inscription.pendus` : Par ordre du Soleil Blême : qui nourrit un chat nourrit la sorcière. Les cordes sont prêtes.
- `inscription.carrefour` : Trois chemins, trois pattes. Prends celui qui boite : c’est le seul sans piège.
- `inscription.sillons` : Elle a semé des ressorts sous les sillons. Les rats n’ont pas passé l’hiver. Les hommes ont oublié pourquoi.
- `inscription.meules` : Neuf nuits. À la dixième, on n’a plus frappé à la porte. On a apporté le feu.
- `inscription.aire` : Pour la Silencieuse : un bol de lait, posé dans le noir. Ne pas regarder qui le boit.
- `inscription.ruelles` : Elle a donné son reflet contre un passage. Le passage… nous… le reste.
- `inscription.place` : Ici fut dressé le Premier Bûcher. Trois bêtes y furent rendues à la cendre. Le ciel pâlit trois jours.
- `inscription.beffroi` : On ne lui a jamais appris l’ordre de reculer. Personne n’a osé l’écrire.
- `inscription.ponton` : La patte est restée dans la mâchoire. Elle est revenu chercher la mâchoire.
- `inscription.etang` : On a sondé l’étang pour trouver son corps. Les cordes sont revenues sèches.
- `inscription.saules` : Que toute bête noire soit noyée avant le premier gel. Ainsi purifiés, nous serons épargnés.
- `inscription.quarantaine` : Le mal venait des chats. Les chats sont morts. Le mal…
- `inscription.faubourg` : Ses machines tournent encore dans les caves. Elles prennent les rats. Personne ne les remonte.
- `inscription.marche` : On pesait le grain contre sa pierre. Elle était trop lourde pour mentir.
- `inscription.fossoyage` : Ils ont dû attendre qu’il tombe de lui-même. Le bois a brûlé avant lui.
- `inscription.tertres` : Ici repose une patte. Le reste ne repose pas.
- `inscription.ossuaire` : On a compté les crânes. Il en manque toujours un : celui qui ne laissait pas d’ombre.
- `inscription.bivouac` : Ils ont brûlé la porte. Pas ce qui la tenait.
- `inscription.palissade` : Les pieux sont taillés à sa manière. Ceux qui les plantent ne savent plus de qui vient ce geste.
- `inscription.baliste` : Frappez la bête où qu’elle se cache. Le Soleil Blême ne compte pas les…
- `inscription.cloitre` : Les moines ont fait vœu de silence. Ils croyaient l’avoir inventé.
- `inscription.refectoire` : Les frères mangent debout, dos à la porte. Une vieille règle. Nul ne sait plus qui la gardait.
- `inscription.scriptorium` : Rature trois noms à chaque copie. Si un nom résiste, brûle la page. Si la page résiste…
- `inscription.avenue` : Ici furent effacés Plume, Charlie et Pollen, que priaient les granges. Que nul ne les nomme plus. Dessous, d’une griffe : « Pas oubliés. »
- `inscription.douves` : Le pont tient par trois chaînes. La quatrième est restée dans un piège, il y a longtemps.
- `inscription.pont_levis` : Il pèse ce que pèse une promesse tenue. Aucun treuil ne le lève seul.
- `inscription.nef` : Ils ont bâti la nef sur la crypte, pour la faire taire. La crypte ne parlait déjà pas.
- `inscription.transept` : Le sol sonne creux. En dessous, un mécanisme armé attend un pas, un seul.
- `inscription.choeur` : Quand les braises se lèveront, un veilleur sans nom marchera devant. Il n’aura pas d’ombre : elle lui prêtera la sienne.

## Niveaux, région 1 : Le Village Affamé

- `niveau.r1.01.nom` : La Porte Ouverte
- `niveau.r1.01.ambiance` : Les cheminées ne fument plus. Quelqu’un a laissé la porte ouverte. Avant, quelqu’un la tenait.
- `niveau.r1.02.nom` : Le Puits Muet
- `niveau.r1.02.ambiance` : On y jetait les chats pour chasser la peste. Le puits ne rend plus d’écho.
- `niveau.r1.03.nom` : La Route des Pendus
- `niveau.r1.03.ambiance` : Sept cordes, six corps. La septième attend celui qui doutera.
- `niveau.r1.04.nom` : Le Carrefour du Bûcher
- `niveau.r1.04.ambiance` : Le bûcher est éteint depuis l’hiver. La cendre est encore tiède.
- `niveau.r1.05.nom` : Les Chaumes Vides
- `niveau.r1.05.ambiance` : Le grain est mangé, les bêtes aussi. Il reste ce qui bouge encore.
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
- `niveau.r2.05.ambiance` : Même les haies ont brûlé. On ne se cache plus que dans l’ombre qui n’est à personne.
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
- `niveau.r3.02.ambiance` : Les maisons se penchent l’une vers l’autre pour ne pas voir.
- `niveau.r3.03.nom` : La Place du Bûcher
- `niveau.r3.03.ambiance` : Le bois est empilé depuis l’aube. Il ne manque qu’une sorcière.
- `niveau.r3.04.nom` : Le Marché aux Fagots
- `niveau.r3.04.ambiance` : Les fagots se vendent mieux que le pain. Tout le monde sait pourquoi.
- `niveau.r3.05.nom` : La Rue des Délateurs
- `niveau.r3.05.ambiance` : Un volet claque. On vous a vu. On vous a déjà dénoncé.
- `niveau.r3.06.nom` : Le Beffroi Fendu
- `niveau.r3.06.ambiance` : La cloche sonne les condamnations. Elle est fendue, mais elle sonne encore.
- `niveau.r3.07.nom` : L’Échafaud du Juge
- `niveau.r3.07.ambiance` : Le bois est neuf, les marches sont usées. Voilà qui en dit long.
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
- `niveau.r4.03.ambiance` : Les saules pleurent sur l’eau, mais l’eau ne rend rien.
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
- `niveau.r8.02.ambiance` : Quarante moines, un seul vœu : ne plus parler. Quelqu’un le tient encore.
- `niveau.r8.03.nom` : Les Pénitents
- `niveau.r8.03.ambiance` : Ils se frappent jusqu’à ne plus rien sentir. Puis ils frappent les autres.
- `niveau.r8.04.nom` : Le Réfectoire Noir
- `niveau.r8.04.ambiance` : Les tables sont dressées pour un banquet de jeûne. Les bols sont pleins de cendre.
- `niveau.r8.05.nom` : La Fontaine Noire
- `niveau.r8.05.ambiance` : L’eau de la vasque reflète ceux qui s’y penchent. Pas tous.
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
- `collection.skin_plume.desc` : Cousu pour celle qui n’a pas de reflet. Nielle le porte à l’envers, par respect.
- `collection.skin_charlie` : Pelage de Braise
- `collection.skin_charlie.desc` : La couleur d’une porte après neuf nuits de torches. Gond la porte sans savoir.
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
- `collection.skin_rouage.desc` : Chaque couture a sa petite machine. Le patron vient d’un boiteux.
- `collection.skin_lanterne` : Lanterne Veuve
- `collection.skin_lanterne.desc` : Sa flamme brûle pour quelqu’un qui n’est plus là.
- `collection.familier_rat` : Rat Boiteux
- `collection.familier_rat.desc` : Il suit le chat qui ne l’a pas mangé. Il boite du même côté que lui.
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
- `collection.familier_salamandre.desc` : Née du Premier Bûcher, elle n’a jamais connu le froid. Elle a vu qui y brûlait.

## Fin de campagne

- `campagne.fin_titre` : Les Cendres Retombent
- `campagne.fin_illustration` : Le Dernier Veilleur sur les marches de la cathédrale, devant le Soleil Blême éteint.
- `campagne.fin_p1` : Le Soleil Blême s’éteint sur la cathédrale. Ni cri ni triomphe : de la cendre qui retombe sur les dalles, et au loin les cloches qui se taisent une à une.
- `campagne.fin_p2` : Les bûchers ne sont plus que des braises. Dans les granges, dans les cryptes, des pas feutrés reviennent : une ombre sans reflet, une porte qui tient, un pas qui boite. Personne ne dit leurs noms. Le Dernier Veilleur a seulement refusé de laisser mourir ce qu’ils avaient allumé.
- `campagne.fin_p3` : Les hommes oublieront. Les rats reviendront. Mais tant qu’une braise veille quelque part, la nuit n’est pas finie.

## Phrases de fin de partie

- `fin.victoire_detail` : Les braises tiennent encore.
- `fin.defaite_detail` : Le Soleil Blême gagne cette nuit.
- `fin.infini_titre` : La nuit t’a rattrapé
- `fin.infini_detail` : Les vagues ne finissent jamais, seuls les veilleurs s’arrêtent.
