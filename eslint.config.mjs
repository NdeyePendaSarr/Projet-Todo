import next from "eslint-config-next";

/**
 * Config plate native (eslint-config-next 16 l'expose directement).
 * On n'utilise plus FlatCompat : ce shim provoquait un crash de validation
 * ("Converting circular structure to JSON") avec ESLint 9.
 */
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
  {
    // Ces deux règles récentes de react-hooks entrent en conflit avec des
    // patterns volontaires et corrects de l'app :
    //  - set-state-in-effect : on hydrate l'état depuis localStorage APRÈS le
    //    montage (données client-only). C'est précisément ce qui garantit un
    //    rendu SSR cohérent et évite les erreurs d'hydratation.
    //  - refs : on garde une ref synchronisée avec les dernières props pour
    //    qu'un setInterval stable lise toujours la valeur à jour (useReminders).
    // Désactivées en connaissance de cause, pas par facilité.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
];

export default eslintConfig;
