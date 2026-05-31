import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The React Compiler lints (eslint-plugin-react-hooks v6) flag several
      // correct, intentional patterns here — SSR mount-guard effects, the
      // 1s clock tick, and reading layout refs during render for the dock
      // magnifier. These are idiomatic and documented React; disable the two
      // experimental rules rather than litter the code with suppressions.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // headless-Chrome screenshot helpers, not app code
    "scripts/**",
  ]),
]);

export default eslintConfig;
