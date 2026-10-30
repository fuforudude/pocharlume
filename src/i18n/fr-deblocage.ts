// Textes du déblocage progressif des tours (2026-10-30) : cadenas du menu de construction, refus du moteur, et encadré
// « Nouvelles découvertes » de la fiche d'un niveau. Les chiffres viennent des données (src/ui/decouvertes.ts).
export const frDeblocage = {
  'menu.non_debloque': '{nom} (se débloque au niveau {n})',
  'refus.non_debloque': 'Pas encore débloqué à ce niveau.',
  'refus.non_debloque_au': 'Se débloque au niveau {n}.',
  'fiche.decouvertes': 'Nouvelles découvertes',
  'decouverte.niveau': '{nom}, niveau {n}',
  'decouverte.libelle': '{nom} : {apport}',
  'decouverte.specialisation': '{nom} ({base})',
  'decouverte.pouvoir': '{texte}.',
  'decouverte.pouvoir_un': '{nom} : {valeur}',
  'decouverte.soldats': '{n} soldats de {pv} PV qui barrent le chemin, {min} à {max} dégâts par coup.',
  'decouverte.tir': '{min} à {max} dégâts {type} toutes les {cadence} s, portée {portee}.',
  'decouverte.tir_zone': '{min} à {max} dégâts {type} en zone toutes les {cadence} s, portée {portee}.',
  'decouverte.type_physique': 'physiques',
  'decouverte.type_magique': 'magiques',
  'decouverte.type_pur': 'purs',
  'decouverte.divine': 'La tour de ton dieu : une seule par partie, {cout} arêtes. Elle ne s’améliore pas.',
} as const;
