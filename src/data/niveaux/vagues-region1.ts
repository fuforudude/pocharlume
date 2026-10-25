// Vagues figées des 10 niveaux du Village Affamé.
// GÉNÉRÉ par `npm run niveaux` (tools/niveaux/generer.ts) depuis plan-region1.ts : ne pas modifier à la main.
// Pour retoucher les vagues d'un niveau, marquer `retouchees: true` dans son plan : le script les conserve.
import type { Vague } from '../../engine/definitions';

export const VAGUES_REGION1: readonly (readonly Vague[])[] = [
  // Niveau 1 : 6 vagues, menace/budget : 190/220 304/319 417/418 493/517 607/616 683/715.
  [
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 0.7 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 4.6 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 5.9 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 6.6 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 4.6 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 7.2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 7.9 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 1.3 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 3.9 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 5.9 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 8.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 5.9 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 7.2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 10.5 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 11.2 },
      ],
    },
  ],
  // Niveau 2 : 7 vagues, menace/budget : 228/238 342/345 417/451 531/558 645/665 759/772 873/879.
  [
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 2.6 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 4.6 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 0.7 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 0, delai: 3.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 0, delai: 2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 8.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 4.6 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 6.6 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 9.2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 10.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 4.6 },
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 0, delai: 5.3 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 11.8 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 12.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 12, intervalle: 1.3, chemin: 0, delai: 3.3 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 11.1 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 11.8 },
      ],
    },
  ],
  // Niveau 3 : 7 vagues, menace/budget : 230/255 356/370 472/485 594/600 696/715 813/829 943/944.
  [
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 2 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 2.7 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 3.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 4.6 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 5.6 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 2.6 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 4.6 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 7.2 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 7.9 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 4 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 0, delai: 4.7 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 7.7 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 9.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 1 },
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 2.3 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 6.8 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 7.3 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 8 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 9.3 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 0, delai: 10 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 12, intervalle: 1.3, chemin: 0, delai: 3.9 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 11.7 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 13.2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 0.7 },
          { ennemi: 'mendiant', nombre: 10, intervalle: 1, chemin: 0, delai: 2 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 7 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 9 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 0, delai: 12.3 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 16.2 },
      ],
    },
  ],
  // Niveau 4 : 8 vagues, menace/budget : 260/273 379/396 516/518 628/641 751/764 861/887 995/1009 1116/1132.
  [
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 4.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 5.9 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 0, delai: 2.6 },
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 5.1 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 2.6 },
          { ennemi: 'mendiant', nombre: 10, intervalle: 1, chemin: 0, delai: 5.9 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 10.9 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 1 },
          { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.3, chemin: 0, delai: 2.5 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 7.7 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 12.3 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 12.8 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.3, chemin: 0, delai: 2.6 },
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 0, delai: 7.8 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 14.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 4.5 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 7.8 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 9.8 },
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 0, delai: 10.3 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 16.2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 17.2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 5.9 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 7.9 },
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 0, delai: 9.9 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 13.4 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 15.4 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 17.4 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 18.4 },
      ],
    },
  ],
  // Niveau 5 : 8 vagues, menace/budget : 267/290 408/421 548/552 657/682 803/813 933/944 1054/1074 1196/1205.
  [
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 1, delai: 1.6 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 8, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 3.2 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 3.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 2.5 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 3.2 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 1, delai: 4.5 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 5.3 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 5.8 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 6.2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 1, delai: 1.5 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 1, delai: 5 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 7 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 1, delai: 7.4 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 9.4 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 1, delai: 5.9 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 7.5 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 0, delai: 9.5 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 10.3 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 11.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 8, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 0, delai: 3.2 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 1, delai: 4.8 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 1, delai: 9.4 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 1, delai: 0.7 },
          { ennemi: 'chien_errant', nombre: 9, intervalle: 0.8, chemin: 0, delai: 2.7 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 0, delai: 6.3 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 8.3 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 10.3 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 10.7 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 12.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 11, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 7, intervalle: 0.8, chemin: 1, delai: 4.4 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 7.2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 8.2 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 1, delai: 8.9 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 10.1 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 0, delai: 10.8 },
      ],
    },
  ],
  // Niveau 6 : 9 vagues, menace/budget : 304/308 431/447 577/585 699/724 850/862 994/1001 1124/1140 1255/1278 1409/1417.
  [
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.3, chemin: 0, delai: 0 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 1, delai: 0.7 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 2.7 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 3.1 },
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 0, delai: 5.1 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 7, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 2.8 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 1, delai: 1.6 },
          { ennemi: 'mendiant', nombre: 12, intervalle: 1, chemin: 0, delai: 4.6 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 10.6 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 2.5 },
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 0, delai: 3.2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 5.7 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 6.4 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 0, delai: 7.4 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 0, delai: 11.4 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 15.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 1, delai: 4.5 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 1, delai: 7.8 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 1, delai: 9 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 10.5 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 1, delai: 11.8 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 13.4 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 14.4 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 11, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 0, delai: 4.4 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 0, delai: 8.4 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 1, delai: 9.6 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 11.2 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 11.6 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 12.1 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 11, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 1, delai: 7.2 },
          { ennemi: 'chien_errant', nombre: 12, intervalle: 0.8, chemin: 0, delai: 8.5 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 1, delai: 13.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 12, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 4.8 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 1, delai: 9.4 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 0, delai: 10.2 },
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 14.2 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 18.7 },
      ],
    },
  ],
  // Niveau 7 : 10 vagues, menace/budget : 301/326 458/472 616/619 747/765 904/912 1041/1058 1190/1205 1349/1351 1489/1498 1639/1644.
  [
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 0, delai: 1.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 8, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 3.2 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 4.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 1.6 },
          { ennemi: 'mendiant', nombre: 11, intervalle: 1, chemin: 1, delai: 2.9 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 8.4 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 4.6 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 0, delai: 9.1 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 1, delai: 9.9 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 10.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 1, delai: 4 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 5.5 },
          { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 0, delai: 6.8 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 9.2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 1, delai: 4.5 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 0, delai: 7.5 },
          { ennemi: 'mendiant', nombre: 10, intervalle: 1, chemin: 0, delai: 9.5 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 14.5 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 15.2 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 17.2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 11, intervalle: 1, chemin: 1, delai: 5.2 },
          { ennemi: 'paysan_affame', nombre: 11, intervalle: 1.3, chemin: 1, delai: 10.7 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 17.9 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 1, delai: 18.4 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 4.6 },
          { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.3, chemin: 0, delai: 5 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 1, delai: 10.2 },
          { ennemi: 'paysan_affame', nombre: 12, intervalle: 1.3, chemin: 1, delai: 11.8 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 1, delai: 19.6 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 20.9 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 8, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 12, intervalle: 1, chemin: 0, delai: 3.2 },
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 1, delai: 9.2 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 13.2 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 0, delai: 14.7 },
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 0, delai: 15.5 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 19 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 0 },
          { ennemi: 'chien_errant', nombre: 11, intervalle: 0.8, chemin: 0, delai: 0.5 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 0, delai: 4.9 },
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 0, delai: 6.1 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 1, delai: 12 },
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 1, delai: 14.6 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 18.6 },
      ],
    },
  ],
  // Niveau 8 : 10 vagues, menace/budget : 326/343 476/498 648/652 796/807 960/961 1108/1115 1244/1270 1418/1424 1567/1579 1711/1733.
  [
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 0, delai: 0.4 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 1, delai: 2.9 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 1, delai: 0.5 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 0, delai: 2.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 10, intervalle: 1, chemin: 1, delai: 0.7 },
          { ennemi: 'mendiant', nombre: 10, intervalle: 1, chemin: 1, delai: 5.7 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 10.7 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 11.1 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 1, delai: 6.5 },
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 0, delai: 9.8 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 13.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 0, delai: 3.5 },
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 1, delai: 10 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 13.5 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 16.8 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 10, intervalle: 1, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 11, intervalle: 0.8, chemin: 0, delai: 5 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 1, delai: 9.4 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 1, delai: 13.3 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 15.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 1 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 1, delai: 2.3 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 1, delai: 3.9 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 0, delai: 7.2 },
          { ennemi: 'chien_errant', nombre: 7, intervalle: 0.8, chemin: 0, delai: 8.4 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 1, delai: 11.2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 15.8 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 2.6 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 3 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 1, delai: 3.4 },
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 1, delai: 8 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 0, delai: 14.5 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 1, delai: 18.4 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 1, delai: 21 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 21.8 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 22.5 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 12, intervalle: 1.3, chemin: 0, delai: 2.4 },
          { ennemi: 'mendiant', nombre: 12, intervalle: 1, chemin: 0, delai: 10.2 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 16.2 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 1, delai: 20.8 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 22.8 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 0, delai: 2 },
          { ennemi: 'mendiant', nombre: 11, intervalle: 1, chemin: 1, delai: 6 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 11.5 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 13.5 },
          { ennemi: 'mendiant', nombre: 12, intervalle: 1, chemin: 1, delai: 14.8 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 20.8 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 24.1 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 0, delai: 24.8 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 25.6 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 27.1 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 27.5 },
      ],
    },
  ],
  // Niveau 9 : 11 vagues, menace/budget : 342/361 502/523 683/686 846/848 997/1010 1169/1173 1311/1335 1494/1497 1644/1660 1799/1822 1983/1984.
  [
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 1, delai: 4.6 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 1, delai: 3.3 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 2, delai: 5.8 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 8.8 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 2, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 7, intervalle: 1.3, chemin: 2, delai: 5.9 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 10.5 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 11.2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 2, delai: 0 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 2, delai: 4 },
          { ennemi: 'mendiant', nombre: 12, intervalle: 1, chemin: 1, delai: 4.8 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 2, delai: 4 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 2, delai: 5 },
          { ennemi: 'paysan_affame', nombre: 12, intervalle: 1.3, chemin: 1, delai: 5.4 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 2, delai: 0 },
          { ennemi: 'chien_errant', nombre: 7, intervalle: 0.8, chemin: 0, delai: 3 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 2, delai: 5.8 },
          { ennemi: 'paysan_affame', nombre: 11, intervalle: 1.3, chemin: 2, delai: 9.8 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 17 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 1, delai: 0 },
          { ennemi: 'mendiant', nombre: 12, intervalle: 1, chemin: 1, delai: 2.6 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 8.6 },
          { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.3, chemin: 0, delai: 11.2 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 16.4 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 1, delai: 17.4 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 18.6 },
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 0, delai: 19.9 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.3, chemin: 1, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 12, intervalle: 1.3, chemin: 0, delai: 5.2 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 1, delai: 13 },
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 2, delai: 13.8 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 17.8 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 18.2 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 19.7 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 20.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 1, delai: 4 },
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 2, delai: 6.6 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 0, delai: 12.5 },
          { ennemi: 'mendiant', nombre: 10, intervalle: 1, chemin: 2, delai: 16.5 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 1, delai: 21.5 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 1, delai: 22.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 1, delai: 0 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 0, delai: 3 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 2, delai: 4 },
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 1, delai: 6 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 1, delai: 12.5 },
          { ennemi: 'mendiant', nombre: 4, intervalle: 1, chemin: 0, delai: 16.4 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 0, delai: 18.4 },
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 21.4 },
          { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 2, delai: 25.9 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 1, delai: 0.8 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 1, delai: 2.1 },
          { ennemi: 'paysan_affame', nombre: 6, intervalle: 1.3, chemin: 1, delai: 3.4 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 2, delai: 7.3 },
          { ennemi: 'paysan_affame', nombre: 8, intervalle: 1.3, chemin: 2, delai: 10.3 },
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 0, delai: 15.5 },
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 1, delai: 21.4 },
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 2, delai: 24.9 },
          { ennemi: 'paysan_affame', nombre: 5, intervalle: 1.3, chemin: 2, delai: 30.8 },
      ],
    },
  ],
  // Niveau 10 : 12 vagues, menace/budget : 369/378 546/549 718/719 882/889 1057/1060 1207/1230 1383/1400 1570/1570 1722/1741 1907/1911 2059/2081 20546/2251.
  [
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 2, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 2.4 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 3.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 0 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 1, delai: 0.5 },
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 1, delai: 2.5 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 2, delai: 6 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 6.8 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 2, delai: 2.4 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 4.8 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 5.2 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 5.7 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 0, delai: 0 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 2, delai: 2.6 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 1, delai: 6.6 },
          { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 0, delai: 7.4 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 2, delai: 9.8 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 10.5 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 1, delai: 11 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 12.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 1, delai: 1.2 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 0, delai: 2.8 },
          { ennemi: 'mendiant', nombre: 7, intervalle: 1, chemin: 0, delai: 4.1 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 2, delai: 7.6 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 11.6 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 2, delai: 12.1 },
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 1, delai: 12.5 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 15 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 15.5 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 1, delai: 16 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 2, delai: 0 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 2, delai: 0.4 },
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 0, delai: 3.4 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 2, delai: 4.9 },
          { ennemi: 'chien_errant', nombre: 12, intervalle: 0.8, chemin: 2, delai: 6.5 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 0, delai: 11.3 },
          { ennemi: 'chien_errant', nombre: 3, intervalle: 0.8, chemin: 0, delai: 12 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 13.2 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 11, intervalle: 0.8, chemin: 0, delai: 0 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 0, delai: 4.4 },
          { ennemi: 'chien_errant', nombre: 9, intervalle: 0.8, chemin: 0, delai: 6.4 },
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 0, delai: 10 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 11, intervalle: 1.3, chemin: 2, delai: 0 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 1, delai: 7.2 },
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 2, delai: 10.2 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 14.2 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 1, delai: 15.2 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 2, delai: 19.2 },
          { ennemi: 'mendiant', nombre: 8, intervalle: 1, chemin: 0, delai: 19.6 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 1, delai: 23.6 },
      ],
    },
    {
      paquets: [
          { ennemi: 'mendiant', nombre: 3, intervalle: 1, chemin: 2, delai: 0 },
          { ennemi: 'chien_errant', nombre: 5, intervalle: 0.8, chemin: 2, delai: 1.5 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 2, delai: 3.5 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 2, delai: 4.2 },
          { ennemi: 'paysan_affame', nombre: 10, intervalle: 1.3, chemin: 2, delai: 6.2 },
          { ennemi: 'chien_errant', nombre: 9, intervalle: 0.8, chemin: 2, delai: 12.7 },
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 1, delai: 16.3 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 20.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 1, delai: 0 },
          { ennemi: 'mendiant', nombre: 5, intervalle: 1, chemin: 2, delai: 0.4 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 2, delai: 2.9 },
          { ennemi: 'paysan_affame', nombre: 12, intervalle: 1.3, chemin: 0, delai: 4.5 },
          { ennemi: 'chien_errant', nombre: 11, intervalle: 0.8, chemin: 0, delai: 12.3 },
          { ennemi: 'paysan_affame', nombre: 9, intervalle: 1.3, chemin: 0, delai: 16.7 },
          { ennemi: 'chien_errant', nombre: 4, intervalle: 0.8, chemin: 0, delai: 22.6 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 24.2 },
          { ennemi: 'paysan_affame', nombre: 1, intervalle: 1.3, chemin: 2, delai: 24.7 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 0, delai: 25.3 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 2, delai: 0 },
          { ennemi: 'chien_errant', nombre: 10, intervalle: 0.8, chemin: 0, delai: 2 },
          { ennemi: 'chien_errant', nombre: 12, intervalle: 0.8, chemin: 2, delai: 6 },
          { ennemi: 'paysan_affame', nombre: 4, intervalle: 1.3, chemin: 2, delai: 10.8 },
          { ennemi: 'mendiant', nombre: 11, intervalle: 1, chemin: 1, delai: 13.4 },
          { ennemi: 'paysan_affame', nombre: 3, intervalle: 1.3, chemin: 2, delai: 18.9 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 1, delai: 20.8 },
          { ennemi: 'mendiant', nombre: 12, intervalle: 1, chemin: 0, delai: 22.1 },
          { ennemi: 'mendiant', nombre: 1, intervalle: 1, chemin: 2, delai: 28.1 },
      ],
    },
    {
      paquets: [
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 2, delai: 0 },
          { ennemi: 'mendiant', nombre: 2, intervalle: 1, chemin: 1, delai: 1.3 },
          { ennemi: 'chien_errant', nombre: 6, intervalle: 0.8, chemin: 1, delai: 2.3 },
          { ennemi: 'chien_errant', nombre: 12, intervalle: 0.8, chemin: 1, delai: 4.7 },
          { ennemi: 'chien_errant', nombre: 2, intervalle: 0.8, chemin: 0, delai: 9.5 },
          { ennemi: 'paysan_affame', nombre: 2, intervalle: 1.3, chemin: 1, delai: 10.3 },
          { ennemi: 'mendiant', nombre: 6, intervalle: 1, chemin: 1, delai: 11.6 },
          { ennemi: 'mendiant', nombre: 10, intervalle: 1, chemin: 1, delai: 14.6 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 2, delai: 19.6 },
          { ennemi: 'paysan_affame', nombre: 11, intervalle: 1.3, chemin: 1, delai: 20 },
          { ennemi: 'mendiant', nombre: 9, intervalle: 1, chemin: 0, delai: 27.2 },
          { ennemi: 'chien_errant', nombre: 1, intervalle: 0.8, chemin: 0, delai: 31.7 },
          { ennemi: 'boucher_vaudrelle', nombre: 1, intervalle: 0, chemin: 0, delai: 12 },
      ],
    },
  ],
];
