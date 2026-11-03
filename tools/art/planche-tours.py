"""Compose les planches de comparaison des tours (docs/tours/*.png) à partir des cadres exportés par
tools/art/planche-tours.ts : sprites agrandis sans lissage, sur l'herbe du Village, nom sous chaque sprite.

Usage :
  node tools/art/planche-tours.ts <tmp>
  python tools/art/planche-tours.py <tmp> avant docs/tours/planche-avant.png   (ou apres → planche-apres.png)
  python tools/art/planche-tours.py <tmp> proposition docs/tours/planche-proposition.png
  python tools/art/planche-tours.py <tmp> gif docs/tours/proposition-animee.gif
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FACTEUR = 5
FOND = (29, 27, 26)
TEXTE = (229, 233, 222)
TEXTE_DOUX = (174, 166, 150)
OR = (223, 199, 111)
MARGE = 24
ECART = 14
SEPARATION = 40

FAMILLES = [
    ("Grenier des Griffes (caserne)", "caserne", ("Garde du Cloître", "cloitre"), ("Écorcheurs", "ecorcheurs")),
    ("Clocher des Archers (tir)", "tir", ("Guetteurs des Toits", "guetteurs"), ("Arbalétriers du Beffroi", "beffroi")),
    ("Autel des Cendres (magie)", "magie", ("Oracle de la Braise", "oracle"), ("Nécromancien des Neuf Vies", "necromancien")),
    ("Catapulte du Rempart (artillerie)", "artillerie", ("Mortier de Soufre", "mortier"), ("Baliste à Chaînes", "baliste")),
]


def police(taille, gras=False):
    for nom in (["segoeuib.ttf", "arialbd.ttf"] if gras else ["segoeui.ttf", "arial.ttf"]):
        try:
            return ImageFont.truetype(f"C:/Windows/Fonts/{nom}", taille)
        except OSError:
            pass
    return ImageFont.load_default(taille)


def charger(dossier, nom, cadre=0):
    return Image.open(dossier / f"{nom}.{cadre}.png").convert("RGBA")


def boite_utile(images_ancres):
    """Zone opaque commune (relative à l'ancre) d'une rangée de sprites."""
    gauche = haut = 10**6
    droite = bas = -(10**6)
    for image, (ax, ay) in images_ancres:
        b = image.getbbox()
        if not b:
            continue
        gauche, haut = min(gauche, b[0] - ax), min(haut, b[1] - ay)
        droite, bas = max(droite, b[2] - ax), max(bas, b[3] - ay)
    return gauche - 3, haut - 3, droite + 3, bas + 3


def herbe(dossier, largeur, hauteur):
    tuiles = [Image.open(dossier / f"herbe-{i}.png").convert("RGBA") for i in (1, 2, 3)]
    fond = Image.new("RGBA", (largeur, hauteur))
    for y in range(0, hauteur, 16):
        for x in range(0, largeur, 16):
            v = (x // 16 * 7 + y // 16 * 13) % 5
            fond.paste(tuiles[0 if v < 3 else v - 2], (x, y))
    return fond


def composer(dossier, rangees, titre, sous_titre):
    """rangees : [(titre de famille, [groupes]), …], un groupe = (légende de groupe, [(nom affiché, sprite), …])."""
    index = json.loads((dossier / "index.json").read_text(encoding="utf-8"))
    f_titre, f_famille, f_nom, f_groupe = police(30, True), police(22, True), police(17), police(15)
    blocs = []
    for famille, groupes in rangees:
        items = [(n, s, charger(dossier, s), tuple(index[s]["ancre"])) for _, g in groupes for n, s in g]
        g, h, d, b = boite_utile([(im, a) for _, _, im, a in items])
        blocs.append((famille, groupes, items, (g, h, d, b)))

    largeur_case = max(d - g for *_, (g, _, d, _) in blocs) * (FACTEUR + 1) + 8
    hauteur_nom = 48
    largeur = MARGE * 2 + max(
        sum(len(gr) * (largeur_case + ECART) for _, gr in groupes) + SEPARATION * (len(groupes) - 1)
        for _, groupes, _, _ in blocs
    )
    hauteurs = [(b - h) * FACTEUR for *_, (_, h, _, b) in blocs]
    hauteur = MARGE + 80 + sum(36 + 22 + hc + hauteur_nom + 18 for hc in hauteurs) + MARGE
    planche = Image.new("RGBA", (largeur, hauteur), FOND + (255,))
    dessin = ImageDraw.Draw(planche)
    dessin.text((MARGE, MARGE), titre, font=f_titre, fill=OR)
    dessin.text((MARGE, MARGE + 42), sous_titre, font=f_groupe, fill=TEXTE_DOUX)
    y = MARGE + 80
    for (famille, groupes, items, (g, h, d, b)), hc in zip(blocs, hauteurs):
        dessin.text((MARGE, y), famille, font=f_famille, fill=TEXTE)
        y += 36
        x = MARGE
        i = 0
        for legende, liste in groupes:
            dessin.text((x, y), legende, font=f_groupe, fill=OR)
            for _ in liste:
                nom, sprite, image, (ax, ay) = items[i]
                i += 1
                fond = herbe(dossier, (d - g), (b - h))
                fond.alpha_composite(image, (-g - ax, -h - ay))
                grand = fond.resize(((d - g) * FACTEUR, (b - h) * FACTEUR), Image.NEAREST)
                ox = x
                planche.paste(grand, (ox, y + 22))
                # le même sprite à la taille réelle, à droite de la case
                petit = herbe(dossier, d - g, b - h)
                petit.alpha_composite(image, (-g - ax, -h - ay))
                planche.paste(petit, (ox + grand.width + 8, y + 22 + grand.height - petit.height))
                lignes = nom.split("\n")
                for k, ligne in enumerate(lignes):
                    l = dessin.textlength(ligne, font=f_nom)
                    dessin.text((x + (largeur_case - l) / 2, y + 22 + hc + 6 + k * 20), ligne, font=f_nom,
                                fill=TEXTE if k == 0 else TEXTE_DOUX)
                x += largeur_case + ECART
            x += SEPARATION - ECART
            if legende is not groupes[-1][0]:
                dessin.line([(x - SEPARATION // 2 - 3, y + 22), (x - SEPARATION // 2 - 3, y + 22 + hc)], fill=(90, 85, 76), width=2)
        y += 22 + hc + hauteur_nom + 18
    return planche.convert("RGB")


def rangees_avant():
    rangees = []
    for titre, fam, (na, sa), (nb, sb) in FAMILLES:
        rangees.append((titre, [
            ("Niveaux", [(f"Niveau {n}", f"tour-{fam}-{n}") for n in (1, 2, 3)]),
            ("Spécialisations", [(na, f"tour-{fam}-{sa}"), (nb, f"tour-{fam}-{sb}")]),
        ]))
    return rangees


def rangees_proposition(index):
    rangees = []
    for titre, fam, *_ in FAMILLES:
        props = [n for n in (1, 2, 3) if f"prop-tour-{fam}-{n}" in index]
        if not props:
            continue
        rangees.append((titre, [
            ("Actuel", [(f"Niveau {n}", f"tour-{fam}-{n}") for n in (1, 2, 3)]),
            ("Proposition", [(f"Niveau {n}\nproposé", f"prop-tour-{fam}-{n}") for n in props]),
        ]))
    return rangees


def gif(dossier, sortie):
    """Animation de repos des maquettes, côte à côte, ×FACTEUR (flammes, fanions, bannières)."""
    index = json.loads((dossier / "index.json").read_text(encoding="utf-8"))
    noms = [n for n in index if n.startswith("prop-")]
    images = {n: [charger(dossier, n, i) for i in range(index[n]["cadres"])] for n in noms}
    g, h, d, b = boite_utile([(im, tuple(index[n]["ancre"])) for n in noms for im in images[n]])
    largeur = (d - g) * len(noms)
    cadres = []
    for t in range(12):
        fond = herbe(dossier, largeur, b - h)
        for k, n in enumerate(noms):
            ax, ay = index[n]["ancre"]
            im = images[n][t % len(images[n])]
            fond.alpha_composite(im, (k * (d - g) - g - ax, -h - ay))
        cadres.append(fond.resize((largeur * FACTEUR, (b - h) * FACTEUR), Image.NEAREST).convert("RGB"))
    cadres[0].save(sortie, save_all=True, append_images=cadres[1:], duration=160, loop=0)
    print(f"{sortie} : {len(noms)} maquettes animées")


def main():
    dossier, quoi, sortie = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    if quoi == "gif":
        gif(dossier, sortie)
        return
    if quoi in ("avant", "apres"):
        titre = "Tours de Pocharlume : état actuel" if quoi == "avant" else "Tours de Pocharlume : après la refonte"
        planche = composer(dossier, rangees_avant(), titre,
                           f"Premier cadre de repos, agrandi ×{FACTEUR} sur l'herbe du Village. "
                           "À droite de chaque case : le sprite à la taille réelle.")
    else:
        index = json.loads((dossier / "index.json").read_text(encoding="utf-8"))
        planche = composer(dossier, rangees_proposition(index), "Tours : proposition de niveaux plus marqués",
                           f"À gauche l'existant, à droite la maquette (art/propositions/, hors jeu). ×{FACTEUR}, "
                           "taille réelle à droite de chaque case.")
    sortie.parent.mkdir(parents=True, exist_ok=True)
    planche.save(sortie)
    print(f"{sortie} : {planche.width}×{planche.height}")


if __name__ == "__main__":
    main()
