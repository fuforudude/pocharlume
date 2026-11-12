"""Planche de synthèse des skins du DLC « Temps modernes » : pour chaque famille (un fichier source), l'original en haut
et le skin en dessous, agrandis sans lissage, avec le skin à la taille réelle à côté et son nom.

Lit docs/dlc-moderne/index.json et les aperçus écrits par `npm run dlc:apercu` (à lancer d'abord).
Le titre d'une famille est la ligne `#= Titre` de sa source (à défaut, le nom du fichier).

Pour les héros (catégorie `heros`), l'original et le skin sont côte à côte, agrandis ×5, puis les deux à la taille
réelle : une ligne par dieu (un fichier source), trois héros par ligne.

Usage :
  python tools/dlc/planche.py tour docs/dlc-moderne/planche-tours.png
  python tools/dlc/planche.py ennemi docs/dlc-moderne/planche-ennemis.png
  python tools/dlc/planche.py heros docs/dlc-moderne/planche-heros.png
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RACINE = Path(__file__).resolve().parents[2]
DOCS = RACINE / "docs" / "dlc-moderne"
FACTEUR = 4
FOND = (29, 27, 26)
TEXTE = (229, 233, 222)
TEXTE_DOUX = (174, 166, 150)
OR = (223, 199, 111)
MARGE = 24
ECART = 18


def police(taille, gras=False):
    for nom in (("segoeuib.ttf" if gras else "segoeui.ttf"), ("DejaVuSans-Bold.ttf" if gras else "DejaVuSans.ttf")):
        try:
            return ImageFont.truetype(nom, taille)
        except OSError:
            continue
    return ImageFont.load_default()


FACTEUR_HEROS = 5
CATEGORIES = {"tour": "tours", "ennemi": "ennemis", "heros": "héros"}


def charger(chemin, facteur_index, facteur=FACTEUR):
    """Aperçu ramené à la taille réelle, puis agrandi au facteur de la planche."""
    image = Image.open(DOCS / chemin).convert("RGB")
    reel = image.resize((image.width // facteur_index, image.height // facteur_index), Image.NEAREST)
    return reel, reel.resize((reel.width * facteur, reel.height * facteur), Image.NEAREST)


def planche_heros(familles, facteur_index, sortie):
    """Une ligne par dieu ; chaque héros : original et skin côte à côte (×5), puis les deux à la taille réelle."""
    f_titre, f_nom, f_petit, f_gros = police(22, True), police(15), police(13), police(30, True)
    lignes = []
    for source, skins in familles.items():
        cases = []
        for s in skins:
            reel, skin = charger(s["apercu"], facteur_index, FACTEUR_HEROS)
            reel_o, original = charger(s["apercuOriginal"], facteur_index, FACTEUR_HEROS)
            largeur = max(original.width + 6 + skin.width + 10 + reel_o.width + 4 + reel.width,
                          int(f_nom.getlength(s["nom"])) + 6)
            cases.append((s, reel_o, original, reel, skin, largeur))
        haut = max(max(c[2].height, c[4].height) for c in cases)
        lignes.append((titre_famille(source), cases, haut))
    largeur = MARGE * 2 + max(sum(c[5] for c in cases) + ECART * 2 * (len(cases) - 1) for _, cases, _ in lignes)
    hauteur = MARGE + 60 + sum(34 + 18 + h + 50 for _, _, h in lignes) + MARGE
    planche = Image.new("RGB", (largeur, hauteur), FOND)
    d = ImageDraw.Draw(planche)
    d.text((MARGE, MARGE - 4), "DLC « Temps modernes » : skins de héros", font=f_gros, fill=OR)
    d.text((MARGE, MARGE + 34), f"Pose de repos, agrandie ×{FACTEUR_HEROS} : à gauche l'original du jeu, à droite le skin "
           "(puis les deux à la taille réelle).", font=f_petit, fill=TEXTE_DOUX)
    y = MARGE + 60
    for titre, cases, haut in lignes:
        d.text((MARGE, y + 6), titre, font=f_titre, fill=TEXTE)
        y += 34
        x = MARGE
        for s, reel_o, original, reel, skin, l in cases:
            d.text((x, y), "Original", font=f_petit, fill=OR)
            d.text((x + original.width + 6, y), "Skin", font=f_petit, fill=OR)
            bas = y + 18 + haut
            planche.paste(original, (x, bas - original.height))
            planche.paste(skin, (x + original.width + 6, bas - skin.height))
            xr = x + original.width + 6 + skin.width + 10
            planche.paste(reel_o, (xr, bas - reel_o.height))
            planche.paste(reel, (xr + reel_o.width + 4, bas - reel.height))
            d.text((x, bas + 6), s["nom"], font=f_nom, fill=TEXTE)
            d.text((x, bas + 26), s["id"], font=f_petit, fill=TEXTE_DOUX)
            x += l + ECART * 2
        y += 18 + haut + 50
    sortie.parent.mkdir(parents=True, exist_ok=True)
    planche.save(sortie, optimize=True)
    print(f"{sum(len(c) for _, c, _ in lignes)} skins sur {sortie}")


def titre_famille(source):
    try:
        for ligne in (RACINE / source).read_text(encoding="utf-8").splitlines():
            if ligne.startswith("#= "):
                return ligne[3:].strip()
    except OSError:
        pass
    return Path(source).stem


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    categorie, sortie = sys.argv[1], Path(sys.argv[2])
    index = json.loads((DOCS / "index.json").read_text(encoding="utf-8"))
    facteur_index = index["facteur"]
    familles = {}
    for skin in index["skins"]:
        if skin["categorie"] == categorie:
            familles.setdefault(skin["source"], []).append(skin)
    if not familles:
        sys.exit(f"aucun skin de catégorie « {categorie} » dans l'index")
    if categorie == "heros":
        planche_heros(familles, facteur_index, sortie)
        return

    f_titre, f_nom, f_petit, f_gros = police(22, True), police(15), police(13), police(30, True)
    lignes = []
    for source, skins in familles.items():
        cases = []
        for s in skins:
            reel, skin = charger(s["apercu"], facteur_index)
            original = charger(s["apercuOriginal"], facteur_index)[1] if s["apercuOriginal"] else None
            largeur = max(skin.width + 8 + reel.width, original.width if original else 0, 150,
                          int(f_nom.getlength(s["nom"])) + 6)
            cases.append((s, reel, skin, original, largeur))
        haut_orig = max((c[3].height for c in cases if c[3]), default=0)
        haut_skin = max(c[2].height for c in cases)
        lignes.append((titre_famille(source), cases, haut_orig, haut_skin))

    largeur = MARGE * 2 + max(sum(c[4] for c in cases) + ECART * (len(cases) - 1) for _, cases, _, _ in lignes)
    hauteur = MARGE + 60 + sum(34 + 18 + ho + 14 + hs + 50 for _, _, ho, hs in lignes) + MARGE
    planche = Image.new("RGB", (largeur, hauteur), FOND)
    d = ImageDraw.Draw(planche)
    d.text((MARGE, MARGE - 4), "DLC « Temps modernes » : skins de " + CATEGORIES.get(categorie, categorie), font=f_gros, fill=OR)
    d.text((MARGE, MARGE + 34), f"Pose de repos, agrandie ×{FACTEUR}. En haut l'original du jeu, en dessous le skin "
           "(et à droite le skin à la taille réelle).", font=f_petit, fill=TEXTE_DOUX)
    y = MARGE + 60
    for titre, cases, haut_orig, haut_skin in lignes:
        d.text((MARGE, y + 6), titre, font=f_titre, fill=TEXTE)
        y += 34
        d.text((MARGE, y), "Original", font=f_petit, fill=OR)
        y += 18
        x = MARGE
        for s, reel, skin, original, l in cases:
            if original:
                planche.paste(original, (x, y + haut_orig - original.height))
            planche.paste(skin, (x, y + haut_orig + 14 + haut_skin - skin.height))
            planche.paste(reel, (x + skin.width + 8, y + haut_orig + 14 + haut_skin - reel.height))
            d.text((x, y + haut_orig + 14 + haut_skin + 6), s["nom"], font=f_nom, fill=TEXTE)
            d.text((x, y + haut_orig + 14 + haut_skin + 26), s["id"], font=f_petit, fill=TEXTE_DOUX)
            x += l + ECART
        y += haut_orig + 14 + haut_skin + 50
    sortie.parent.mkdir(parents=True, exist_ok=True)
    planche.save(sortie, optimize=True)
    print(f"{sum(len(c) for _, c, _, _ in lignes)} skins sur {sortie}")


if __name__ == "__main__":
    main()
