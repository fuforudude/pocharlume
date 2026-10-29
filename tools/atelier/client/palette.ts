// Vue « Palette » : changer la couleur d'une lettre et voir tous les sprites concernés changer.
import type { DocumentPalette, VignetteSprite } from '../types.ts';
import { appeler, canvasDe, dernierSeulement, el } from './outils.ts';
import type { Contexte, Vue } from './vue.ts';

export async function monterPalette(racine: HTMLElement, ctx: Contexte): Promise<Vue> {
  const noms = await appeler<string[]>('/api/palette');
  const nom = noms[0];
  if (nom === undefined) {
    racine.replaceChildren(el('p', { class: 'aide', texte: 'Aucune palette modifiable.' }));
    return { enregistrer: () => Promise.resolve(), touche: () => false, arreter: () => undefined };
  }
  const doc = await appeler<DocumentPalette>(`/api/palette/doc?nom=${encodeURIComponent(nom)}`);
  /** Lettre vers nouvelle couleur, pour les seules lettres changées. */
  const changements = new Map<string, string>();
  let origine = new Map(doc.couleurs.map((c) => [c.lettre, c.couleur]));

  const avertissement = el('div', { class: 'avert', hidden: '' });
  const lignes = el('div', {});
  const vignettes = el('div', { class: 'vignettes' });
  const titreVignettes = el('strong', { texte: 'Sprites concernés' });
  const gauche = el('div', { class: 'colonne centre' },
    el('strong', { texte: `Palette « ${doc.nom} »` }),
    el('div', { class: 'aide', texte: 'Choisir une couleur change la lettre dans tous les sprites qui l\'emploient. Annuler : remettre la couleur d\'origine.' }),
    avertissement, lignes);
  const droite = el('div', { class: 'colonne centre' }, titreVignettes, vignettes);
  racine.replaceChildren(gauche, droite);

  const rgb = (hex: string): string => hex.slice(0, 7);
  const alpha = (hex: string): string => hex.slice(7);

  for (const c of doc.couleurs) {
    const choix = el('input', { type: 'color', value: rgb(c.couleur), 'aria-label': `Couleur de ${c.lettre}` });
    const texte = el('input', { type: 'text', value: c.couleur, 'aria-label': `Valeur de ${c.lettre}`, maxlength: '9', spellcheck: 'false' });
    const nb = el('span', { class: `nb${c.utilisations >= doc.seuilAvertissement ? ' fort' : ''}`, texte: `${String(c.utilisations)} sprite${c.utilisations > 1 ? 's' : ''}` });
    const reinit = el('button', { type: 'button', title: 'Remettre la couleur d\'origine' }, '↺');
    const appliquer = (valeur: string): void => {
      const v = valeur.toLowerCase();
      if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(v)) return;
      if (v === origine.get(c.lettre)) changements.delete(c.lettre); else changements.set(c.lettre, v);
      choix.value = rgb(v);
      texte.value = v;
      miseAJour(c.lettre, c.utilisations);
    };
    choix.addEventListener('input', () => { appliquer(choix.value + alpha(texte.value)); });
    texte.addEventListener('change', () => { appliquer(texte.value); });
    reinit.addEventListener('click', () => { appliquer(origine.get(c.lettre) ?? c.couleur); });
    const ligne = el('div', { class: 'ligne-couleur' }, choix, el('strong', { texte: c.lettre }), texte, el('span', { class: 'aide', texte: c.commentaire ?? '' }), nb);
    ligne.append(reinit);
    ligne.style.gridTemplateColumns = '34px 24px 90px 1fr 80px 28px';
    lignes.append(ligne);
  }

  function miseAJour(lettre: string, utilisations: number): void {
    ctx.signalerModif(changements.size > 0);
    if (utilisations >= doc.seuilAvertissement && changements.has(lettre)) {
      avertissement.hidden = false;
      avertissement.textContent = `Attention : « ${lettre} » sert à ${String(utilisations)} sprites. Le changement se verra partout, il faudra relire les dérivés (variantes sombres, élites…).`;
    } else {
      avertissement.hidden = true;
    }
    rafraichir();
  }

  const rafraichir = dernierSeulement(async () => {
    if (changements.size === 0) { vignettes.replaceChildren(); titreVignettes.textContent = 'Sprites concernés'; return; }
    const r = await appeler<VignetteSprite[]>('/api/palette/apercu', { nom: doc.nom, changements: Object.fromEntries(changements) });
    titreVignettes.textContent = `Sprites concernés (${String(r.length)})`;
    vignettes.replaceChildren(...r.map((v) => {
      const c = el('canvas', { width: String(v.image.largeur), height: String(v.image.hauteur), style: `width:${String(Math.min(v.image.largeur * 2, 72))}px` });
      c.getContext('2d')?.drawImage(canvasDe(v.image), 0, 0);
      return el('figure', {}, c, el('figcaption', { texte: v.nom }));
    }));
  });

  return {
    async enregistrer() {
      if (changements.size === 0) { ctx.etat('Rien à enregistrer.'); return; }
      const r = await appeler<{ ecrits: string[]; apres: { ok: boolean; message: string } | null }>('/api/palette/enregistrer', { nom: doc.nom, changements: Object.fromEntries(changements) });
      for (const [lettre, couleur] of changements) origine.set(lettre, couleur);
      origine = new Map(origine);
      changements.clear();
      ctx.signalerModif(false);
      ctx.etat(`Enregistré : ${r.ecrits.join(', ') || 'aucun changement'}${r.apres ? ` — ${r.apres.message}` : ''}`, r.apres && !r.apres.ok ? 'erreur' : 'ok');
    },
    touche: () => false,
    arreter: () => undefined,
  };
}
