import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { fixupConfigRules } from "@eslint/compat";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

// Regras que foram renomeadas ou removidas do typescript-eslint v8
const deprecatedTsRules = [
    "@typescript-eslint/brace-style",
    "@typescript-eslint/comma-dangle",
    "@typescript-eslint/comma-spacing",
    "@typescript-eslint/func-call-spacing",
    "@typescript-eslint/keyword-spacing",
    "@typescript-eslint/member-delimiter-style",
    "@typescript-eslint/no-extra-parens",
    "@typescript-eslint/no-extra-semi",
    "@typescript-eslint/object-curly-spacing",
    "@typescript-eslint/semi",
    "@typescript-eslint/space-before-blocks",
    "@typescript-eslint/space-before-function-paren",
    "@typescript-eslint/space-infix-ops",
    "@typescript-eslint/type-annotation-spacing",
    "@typescript-eslint/quotes",
    "@typescript-eslint/block-spacing",
    "@typescript-eslint/key-spacing",
    "@typescript-eslint/lines-around-comment",
    "@typescript-eslint/lines-between-class-members",
    "@typescript-eslint/padding-line-between-statements",
    "@typescript-eslint/indent",
    "@typescript-eslint/no-throw-literal",
    "@typescript-eslint/no-return-await",
    "@typescript-eslint/no-duplicate-imports",
    "@typescript-eslint/sort-type-union-intersection-members",
    "@typescript-eslint/no-implicit-any-catch",
    "@typescript-eslint/no-parameter-properties",
    "@typescript-eslint/no-useless-constructor",
];

// Obter configs do Airbnb e filtrar regras deprecated
const airbnbConfigs = compat.extends("airbnb", "airbnb-typescript");

// Remover regras deprecated de cada config
const cleanedConfigs = airbnbConfigs.map((config) => {
    if (config.rules) {
        const newRules = { ...config.rules };
        deprecatedTsRules.forEach((rule) => {
            delete newRules[rule];
        });
        return { ...config, rules: newRules };
    }
    return config;
});

export default tseslint.config(
    // Ignorar arquivos que não devem ser linted
    {
        ignores: [
            "dist/**",
            "*.config.js",
            "*.config.ts",
            "node_modules/**",
            "postcss.config.js",
            "tailwind.config.ts",
            "vite.config.ts",
            "supabase/**",
            "src/components/ui/**", // Componentes Shadcn UI não devem ser modificados
        ]
    },
    ...fixupConfigRules(cleanedConfigs),
    {
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                project: "./tsconfig.app.json",
            },
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,

            // Indentação de 4 espaços
            "indent": ["error", 4, { SwitchCase: 1 }],
            "react/jsx-indent": ["error", 4],
            "react/jsx-indent-props": ["error", 4],

            // Ajustes para compatibilidade com o projeto
            "react/react-in-jsx-scope": "off",
            "react/require-default-props": "off",
            "import/prefer-default-export": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

            // Permitir function expressions e arrow functions
            "react/function-component-definition": "off",

            // Permitir prop spreading
            "react/jsx-props-no-spreading": "off",

            // Ajustar para não exigir extensões em imports
            "import/extensions": "off",

            // Permitir console em desenvolvimento
            "no-console": "warn",

            // Max line length
            "max-len": ["warn", { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],

            // Permitir operador ternário aninhado (comum em JSX)
            "no-nested-ternary": "off",

            // Permitir incremento/decremento
            "no-plusplus": "off",

            // Ajustar regras de import
            "import/no-extraneous-dependencies": ["error", { devDependencies: true }],

            // Desabilitar regras que causam problemas com componentes Shadcn UI
            "@typescript-eslint/no-use-before-define": "off",
            "@typescript-eslint/no-shadow": "off",
            "@typescript-eslint/naming-convention": "off",
            "react/no-unstable-nested-components": "off",
            "react/jsx-no-constructed-context-values": "off",
            "react/jsx-no-useless-fragment": "off",
            "react/no-danger": "warn",
            "react/no-unknown-property": "off",
            "react/button-has-type": "off",
            "jsx-a11y/heading-has-content": "off",
            "jsx-a11y/anchor-has-content": "off",
            "consistent-return": "off",

            // Permitir for-of loops (muito comum com arrays e iterators)
            "no-restricted-syntax": "off",

            // Permitir await em loops (necessário para algumas operações sequenciais)
            "no-await-in-loop": "off",

            // Permitir export default
            "no-restricted-exports": "off",

            // Flexibilizar switch/case
            "default-case": "off",

            // Permitir construtor com nome minúsculo (libs externas)
            "new-cap": "off",

            // Permitir return em executor de promise
            "no-promise-executor-return": "off",

            // Flexibilizar regras de acessibilidade (podem ser corrigidas gradualmente)
            "jsx-a11y/label-has-associated-control": "warn",
            "jsx-a11y/click-events-have-key-events": "off",
            "jsx-a11y/no-static-element-interactions": "off",
            "jsx-a11y/tabindex-no-positive": "warn",
            "jsx-a11y/control-has-associated-label": "off",
            "jsx-a11y/anchor-is-valid": "off",

            // Flexibilizar regras de React
            "react/no-unescaped-entities": "warn",
            "react/no-array-index-key": "warn",
            "react/prop-types": "off",

            // Permitir continue em loops
            "no-continue": "off",

            // Permitir reatribuição de parâmetros
            "no-param-reassign": ["error", { props: false }],
        },
    },
);
