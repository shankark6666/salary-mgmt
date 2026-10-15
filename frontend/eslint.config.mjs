import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "Never render raw HTML: it bypasses React's XSS escaping."
        }
      ]
    }
  },
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "coverage/**"] }
];

export default config;
