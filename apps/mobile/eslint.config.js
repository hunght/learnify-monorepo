const tsParser = require("@typescript-eslint/parser");

module.exports = [
  {
    ignores: ["node_modules/**", "android/**", ".expo/**", "dist-apk/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {},
  },
];
