import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/**
 * INV-5 / T-INV-5: no application code may import crypto primitives directly.
 *
 * Interpretation (see docs/architecture.md): all *ballot* cryptography (encryption,
 * signatures, ZK proofs) must go through the BallotEngine interface. A small, audited
 * allowlist of packages may import platform crypto for non-ballot primitives —
 * CSPRNG receipt bytes (`receipt`), SHA-256 hash chains (`audit`), engine internals
 * (`ballot-engine`), and the standalone verifier. Everywhere else — and especially
 * `apps/web` and the pure `shared`/`tally` packages — direct crypto imports are banned.
 */
const cryptoImportBan = {
  paths: [
    {
      name: "crypto",
      message:
        "INV-5: route ballot crypto through @ecclesia/ballot-engine. Only receipt/audit/ballot-engine/verifier may import crypto.",
    },
    {
      name: "node:crypto",
      message:
        "INV-5: route ballot crypto through @ecclesia/ballot-engine. Only receipt/audit/ballot-engine/verifier may import node:crypto.",
    },
  ],
  patterns: ["crypto/*", "node:crypto/*"],
};

export default [
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/*.config.js",
      "**/*.config.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { projectService: false },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-restricted-imports": ["error", cryptoImportBan],
    },
  },
  {
    // Audited allowlist — these packages may import crypto directly.
    files: [
      "packages/ballot-engine/**/*.{ts,tsx}",
      "packages/receipt/**/*.{ts,tsx}",
      "packages/audit/**/*.{ts,tsx}",
      "tools/verifier/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
