import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import security from 'eslint-plugin-security';
import xss from 'eslint-plugin-xss';
import globals from 'globals';

// Rules the codebase violates today. They are WARNINGS, not errors, so CI is green on day one --
// but `pnpm lint` passes `--max-warnings 549` (the count at the time this landed), so the debt
// can shrink and never grow. Lower that number in package.json whenever a phase clears warnings;
// `pnpm lint` failing with a count BELOW the cap is the signal to do so.
// Each entry records what it is really telling us; several are tracked fixes in later phases.
const EXISTING_DEBT = {
  // The `ref(props.x ?? new X())` two-way-mutation idiom, in 37 files. Removed in Phase 7.
  'vue/no-mutating-props': 'warn',
  // Same name defined in BOTH `methods:` and `setup()` returns -- e.g. VmessClients. Phase 1 + Phase 6.
  'vue/no-dupe-keys': 'warn',
  // Side-effecting computed getters, e.g. in Http.vue. Removed in Phase 7.
  'vue/no-side-effects-in-computed-properties': 'warn',
  // Components imported and registered but never used in the template. Partly cleaned in Phase 1.
  'vue/no-unused-components': 'warn',
  'vue/no-unused-vars': 'warn',
  'vue/require-v-for-key': 'warn',
  'vue/no-ref-as-operand': 'warn',
  'vue/no-reserved-component-names': 'warn',
  'vue/multi-word-component-names': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
  'no-useless-escape': 'warn',
  'no-useless-assignment': 'warn',
  'prefer-const': 'warn',
  'no-var': 'warn',
  'no-empty': 'warn',
  '@typescript-eslint/no-unused-expressions': 'warn',
  // TypeScript already resolves identifiers, and core no-undef false-positives on type-only names
  // (NodeListOf, Record, ...) inside .vue script blocks. Standard practice for TS projects.
  'no-undef': 'off'
};

// Baseline flat config. Deliberately scoped to rules the codebase already passes, so CI is green
// from the day it lands -- a gate that is red for weeks trains everyone to ignore CI.
//
// NOT enabled yet, on purpose: typescript-eslint's type-checked rules (no-unsafe-*, no-misused-promises,
// ...). The 21 existing `eslint-disable` comments name them, and turning them on today would produce
// hundreds of errors from the `props.x ?? new X()` idiom that Phase 7 removes wholesale. Enable them
// there, not here.
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'tools/**', 'tests/test-results/**', 'docs/**', 'coverage/**']
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],

  {
    // These two plugins are registered with their rules OFF, purely so the existing
    // `eslint-disable security/...` and `xss/...` directives resolve to a known rule instead of
    // erroring. Codacy is what actually enforces them; see .codacy.yaml.
    plugins: { security, xss },
    linterOptions: {
      // The remaining disable comments name typescript-eslint's type-checked rules, which this
      // config does not load yet (see header). Reporting them as unused would be pure noise.
      reportUnusedDisableDirectives: 'off'
    },
    rules: EXISTING_DEBT
  },

  // ---- TypeScript sources -------------------------------------------------
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: { ...globals.browser, ...globals.node }
    }
  },

  // ---- Vue SFCs -----------------------------------------------------------
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      },
      globals: {
        ...globals.browser,
        // ASUS firmware globals injected by the stock scripts loaded in App.html. They are not
        // declared anywhere in this repo -- see src/global.d.ts for the typed subset.
        validator: 'readonly',
        overlib: 'readonly',
        OFFSETX: 'readonly',
        RIGHT: 'readonly',
        DELAY: 'readonly',
        WIDTH: 'readonly',
        STICKY: 'readonly',
        CAPTION: 'readonly'
      }
    },
    rules: {
      // Every `v-html` in this repo renders a translated hint from src/translations/*.json --
      // bundled strings that carry <b>/<br> markup and never contain user input. Both rules fire
      // only on that pattern, ~536 times, which drowned the ratchet and grew with every new hint
      // row. By design, not debt: no XSS surface, and nothing to pay down.
      'vue/no-v-html': 'off',
      'vue/no-v-text-v-html-on-component': 'off',
      // The project's components are named by filename and mounted from a switch/registry, not
      // resolved by multi-word tag rules. Enforcing this would be a rename sweep, which Phase 1
      // explicitly does not do.
      'vue/multi-word-component-names': 'off',
      // Prettier owns formatting in this repo (.prettierrc). Let it.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/attributes-order': 'off',
      'vue/first-attribute-linebreak': 'off'
    }
  },

  // ---- Tests --------------------------------------------------------------
  {
    files: ['**/*.spec.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node, ...globals.browser }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off'
    }
  },

  // ---- Build scripts ------------------------------------------------------
  {
    files: ['vite.config.ts', 'vite.sync.js', 'jest.config.ts', 'babel.config.js', 'eslint.config.mjs'],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off'
    }
  }
);
