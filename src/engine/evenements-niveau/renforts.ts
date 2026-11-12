// Renforts étudiants : des unités alliées apparaissent en un point et tiennent un temps (événement `renforts`, effet de foule `renforts`).
import { UNITES_EVENEMENTS } from '../../data/evenements-niveau';
import type { EvenementRenforts, Niveau, StatsCombattant } from '../definitions';
import type { EtatPartie } from '../etat';
import { enPas } from '../temps';
import { creerUnite, placeEnFormation } from '../unites';

/** Les stats d'une unité de renfort (clé de `UNITES_EVENEMENTS`), lues par propriété propre. */
export function uniteDeRenfort(unite: string): StatsCombattant | undefined {
  return Object.hasOwn(UNITES_EVENEMENTS, unite) ? UNITES_EVENEMENTS[unite] : undefined;
}

/** Vérifie des renforts écrits dans les données : unité connue, nombre entier d'au moins 1, durée positive. */
export function verifierRenforts(quoi: string, unite: string, nombre: number, duree: number): void {
  if (!uniteDeRenfort(unite)) throw new Error(`${quoi} : unité inconnue ${unite}`);
  if (!Number.isInteger(nombre) || nombre < 1) throw new Error(`${quoi} : nombre invalide (${String(nombre)})`);
  if (!(Number.isFinite(duree) && duree > 0)) throw new Error(`${quoi} : durée invalide (${String(duree)})`);
}

export function verifierEvenementRenforts(niveau: Niveau, e: EvenementRenforts, quoi: string): void {
  verifierRenforts(quoi, e.unite, e.nombre, e.duree);
  const { largeur, hauteur } = niveau.carte;
  if (!(Number.isFinite(e.x) && Number.isFinite(e.y) && e.x >= 0 && e.y >= 0 && e.x <= largeur && e.y <= hauteur)) {
    throw new Error(`${quoi} : point hors de la carte (${String(e.x)}, ${String(e.y)})`);
  }
}

/** Fait apparaître `nombre` unités en formation autour de (x, y), pour `duree` secondes ; elles ne réapparaissent pas. */
export function invoquerRenforts(etat: EtatPartie, unite: string, nombre: number, duree: number, x: number, y: number): void {
  const stats = uniteDeRenfort(unite);
  if (!stats) return;
  for (let i = 0; i < nombre; i++) {
    const place = placeEnFormation(i, x, y);
    const u = creerUnite(etat, {
      genre: 'renfort',
      tour: -1,
      emplacement: i,
      x: place.x,
      y: place.y,
      ancreX: place.x,
      ancreY: place.y,
      stats,
      delaiReapparition: -1,
      duree: Math.max(1, enPas(duree)),
      zone: null,
    });
    etat.evenements.push({ type: 'invocation', unite: u.id, genre: 'renfort', x: u.x, y: u.y });
  }
}

export function declencherRenforts(etat: EtatPartie, e: EvenementRenforts): void {
  invoquerRenforts(etat, e.unite, e.nombre, e.duree, e.x, e.y);
}
