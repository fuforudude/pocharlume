import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Invariant clé : src/engine et src/data tournent sans navigateur (simulateur Node, futur serveur)
 * et de façon déterministe. Ils n'importent ni le rendu, ni l'interface, ni la sauvegarde,
 * ne touchent pas au DOM, et ne lisent ni Math.random ni l'horloge.
 * Exporté à part pour que src/architecture.test.ts vérifie ces règles.
 * @type {import('eslint').Linter.Config[]}
 */
export const reglesSimulationPure = [
  {
    files: ['src/engine/**', 'src/data/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '(^|/)(render|ui|save)(/|$)',
          message: 'Le moteur et les données ne dépendent ni du rendu, ni de l’interface, ni de la sauvegarde.',
        }],
      }],
      'no-restricted-globals': ['error',
        ...['window', 'document', 'navigator', 'location', 'localStorage', 'sessionStorage', 'indexedDB',
          'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'setInterval', 'fetch', 'self', 'globalThis']
          .map((name) => ({ name, message: 'Le moteur et les données doivent tourner dans Node, sans navigateur.' })),
      ],
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'Aléatoire à graine uniquement (générateur du moteur).' },
        { object: 'Date', property: 'now', message: 'Le temps du moteur avance par pas fixes, pas par l’horloge.' },
        { object: 'performance', property: 'now', message: 'Le temps du moteur avance par pas fixes, pas par l’horloge.' },
        // Ces fonctions ne sont pas exactement spécifiées : leur résultat peut changer d'un moteur JS à l'autre.
        ...['hypot', 'sin', 'cos', 'tan', 'atan2', 'asin', 'acos', 'pow', 'exp', 'log', 'log2', 'log10', 'cbrt', 'expm1', 'log1p']
          .map((property) => ({
            object: 'Math',
            property,
            message: 'Résultat non garanti identique entre moteurs JS : sqrt et opérations de base seulement (déterminisme).',
          })),
      ],
      'no-restricted-syntax': ['error',
        {
          selector: 'BinaryExpression[operator="**"], AssignmentExpression[operator="**="]',
          message: 'L’opérateur ** n’est pas garanti identique entre moteurs JS : multiplications explicites (déterminisme).',
        },
      ],
    },
  },
];

export default defineConfig(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  reglesSimulationPure,
);
