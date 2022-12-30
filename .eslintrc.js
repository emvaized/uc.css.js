/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this
 * file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/
 * or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA. */

"use strict";

const path = require("path");

module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    sourceType: "script",
    babelOptions: { configFile: path.join(__dirname, ".babel-eslint.rc.js") },
  },
  env: {
    node: false,
    // "mozilla/browser-window": true,
    // "mozilla/chrome-script": true,
    // "mozilla/chrome-worker": true,
    // "mozilla/frame-script": true,
    // "mozilla/jsm": true,
    // "mozilla/privileged": true,
    // "mozilla/process-script": true,
    // "mozilla/remote-page": true,
    // "mozilla/simpletest": true,
    // "mozilla/sjs": true,
    // "mozilla/special-powers-sandbox": true,
    // "mozilla/specific": true,
    // "mozilla/xpcshell": true,
  },
  settings: { "import/extensions": [".mjs"] },
  rules: {
    curly: ["error", "multi-line", "consistent"],
    "linebreak-style": ["error", "unix"],
    "no-console": ["warn", { allow: ["error"] }],
    "no-implied-eval": "error",
    "prefer-numeric-literals": "error",
    "prefer-promise-reject-errors": "error",
    "prefer-reflect": "off",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "prefer-template": "error",
    "prettier/prettier": ["error", {}, { usePrettierrc: true }],
  },
  ignorePatterns: ["node_modules", "utils/**"],
  // allow external repositories that use the plugin to pick them up as well.
  extends: [
    "eslint:recommended",
    "prettier/prettier",
    "plugin:prettier/recommended",
    "plugin:mozilla/recommended",
  ],
  plugins: ["prettier", "mozilla", "import"],
  overrides: [
    {
      files: ["JS/**"],
      parserOptions: {
        sourceType: "script",
        ecmaVersion: "latest",
      },
      env: { browser: true, "mozilla/browser-window": true },
      globals: {
        _ucUtils: "writable",
        windowUtils: "writable",
        tabPreviews: "writable",
        gUnifiedExtensions: "writable",
        UIState: "writable",
        FxAccounts: "writable",
        EnsureFxAccountsWebChannel: "writable",
        SyncedTabs: "writable",
        MIN_STATUS_ANIMATION_DURATION: "writable",
        SyncedTabsPanelList: "writable",
        SyncedTabsDeckComponent: "writable",
        syncedTabsDeckComponent: "writable",
      },
      rules: {
        "arrow-body-style": "off",
        complexity: ["warn", { max: 50 }],
        "consistent-return": "off",
        "mozilla/valid-lazy": "off",
        "no-empty": "off",
        "no-eval": "off",
        "no-unused-vars": "off",
        "prefer-arrow-callback": "off",
      },
    },
    {
      files: ["*@aminomancer/**", "extensions/**"],
      env: { webextensions: true },
      globals: { XPCNativeWrapper: true },
      rules: { complexity: "off", "no-console": "off" },
    },
    {
      files: ["utils/**", "resources/aboutconfig/**"],
      rules: { "prettier/prettier": "off" },
    },
    {
      files: ["prefs/**"],
      rules: { "prettier/prettier": "off" },
      globals: { user_pref: "readonly" },
    },
    {
      files: ["resources/script-override/**"],
      rules: { "prettier/prettier": ["error", { quoteProps: "preserve" }] },
    },
    {
      files: ["resources/aboutuserchrome/**"],
      parserOptions: {
        sourceType: "module",
      },
    },
    {
      // All .eslintrc.js files are in the node environment, so turn that
      // on here.
      // https://github.com/eslint/eslint/issues/13008
      files: [".eslintrc.js"],
      env: { node: true, browser: false },
    },
    {
      files: ["*.mjs"],
      rules: {
        "import/default": "error",
        "import/export": "error",
        "import/named": "error",
        "import/namespace": "error",
        "import/newline-after-import": "error",
        "import/no-anonymous-default-export": "error",
        "import/no-duplicates": "error",
        "import/no-absolute-path": "error",
        "import/no-named-default": "error",
        "import/no-named-as-default": "error",
        "import/no-named-as-default-member": "error",
        "import/no-self-import": "error",
        "import/no-unassigned-import": "error",
        "import/no-unresolved": [
          "error",
          // Bug 1773473 - Ignore resolver URLs for chrome and resource as we
          // do not yet have a resolver for them.
          { ignore: ["chrome://", "resource://"] },
        ],
        "import/no-useless-path-segments": "error",
      },
    },
    {
      files: ["*.html", "*.xhtml", "*.xml"],
      rules: {
        // Curly brackets are required for all the tree via recommended.js,
        // however these files aren't auto-fixable at the moment.
        curly: "off",
      },
    },
    {
      files: ["*.jsx"],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ["import", "react", "jsx-a11y"],
      extends: [
        "eslint:recommended",
        "plugin:react-hooks/recommended",
        "plugin:jsx-a11y/recommended",
        "plugin:mozilla/recommended",
        "plugin:prettier/recommended",
        "prettier",
      ],
      rules: {
        "accessor-pairs": "error",
        "array-callback-return": "error",
        "block-scoped-var": "error",
        "callback-return": "off",
        camelcase: "off",
        "capitalized-comments": "off",
        "class-methods-use-this": "off",
        "consistent-this": ["error", "use-bind"],
        "default-case": "off",
        eqeqeq: "error",
        "fetch-options/no-fetch-credentials": "error",
        "for-direction": "error",
        "func-name-matching": "error",
        "func-names": "off",
        "func-style": "off",
        "getter-return": "error",
        "global-require": "off",
        "guard-for-in": "error",
        "handle-callback-err": "error",
        "id-blacklist": "off",
        "id-length": "off",
        "id-match": "off",
        "init-declarations": "off",
        "jsx-a11y/anchor-has-content": "off",
        "jsx-a11y/heading-has-content": "off",
        "jsx-a11y/label-has-associated-control": "off",
        "jsx-a11y/no-onchange": "off",
        "jsx-a11y/no-access-key": "off",
        "line-comment-position": "off",
        "lines-between-class-members": "error",
        "max-depth": ["error", 4],
        "max-lines": "off",
        "max-nested-callbacks": ["error", 4],
        "max-params": ["error", 6],
        "max-statements": ["error", 50],
        "max-statements-per-line": ["error", { max: 2 }],
        "multiline-comment-style": "off",
        "new-cap": ["error", { capIsNew: false, newIsCap: true }],
        "newline-after-var": "off",
        "newline-before-return": "off",
        "no-alert": "error",
        "no-await-in-loop": "off",
        "no-bitwise": "off",
        "no-buffer-constructor": "error",
        "no-catch-shadow": "error",
        "no-console": ["warn", { allow: ["error"] }],
        "no-continue": "off",
        "no-div-regex": "error",
        "no-duplicate-imports": "error",
        "no-empty-function": "off",
        "no-eq-null": "error",
        "no-extend-native": "error",
        "no-extra-label": "error",
        "no-implicit-coercion": ["error", { allow: ["!!"] }],
        "no-implicit-globals": "error",
        "no-inline-comments": "off",
        "no-invalid-this": "off",
        "no-label-var": "error",
        "no-loop-func": "error",
        "no-magic-numbers": "off",
        "no-mixed-requires": "error",
        "no-multi-assign": "error",
        "no-multi-str": "error",
        "no-negated-condition": "off",
        "no-negated-in-lhs": "error",
        "no-new": "error",
        "no-new-func": "error",
        "no-new-require": "error",
        "no-octal-escape": "error",
        "no-param-reassign": "error",
        "no-path-concat": "error",
        "no-plusplus": "off",
        "no-process-env": "off",
        "no-process-exit": "error",
        "no-proto": "error",
        "no-prototype-builtins": "error",
        "no-restricted-globals": "off",
        "no-restricted-imports": "off",
        "no-restricted-modules": "off",
        "no-restricted-properties": "off",
        "no-restricted-syntax": "off",
        "no-return-assign": ["error", "except-parens"],
        "no-script-url": "error",
        "no-shadow": "error",
        "no-sync": "off",
        "no-template-curly-in-string": "error",
        "no-ternary": "off",
        "no-undef-init": "error",
        "no-undefined": "off",
        "no-underscore-dangle": "off",
        "no-unmodified-loop-condition": "error",
        "no-unused-expressions": "error",
        "no-use-before-define": "error",
        "no-useless-computed-key": "error",
        "no-useless-constructor": "error",
        "no-useless-rename": "error",
        "no-var": "error",
        "no-void": ["error", { allowAsStatement: true }],
        "one-var": ["error", "never"],
        "operator-assignment": ["error", "always"],
        "padding-line-between-statements": "off",
        "prefer-destructuring": [
          "error",
          {
            AssignmentExpression: { array: true },
            VariableDeclarator: { array: true, object: true },
          },
        ],
        "prefer-numeric-literals": "error",
        "prefer-promise-reject-errors": "error",
        "prefer-reflect": "off",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
        "prefer-template": "error",
        radix: ["error", "always"],
        "react/jsx-boolean-value": ["error", "always"],
        "react/jsx-key": "error",
        "react/jsx-no-bind": "error",
        "react/jsx-no-comment-textnodes": "error",
        "react/jsx-no-duplicate-props": "error",
        "react/jsx-no-undef": "error",
        "react/jsx-pascal-case": "error",
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "react/no-access-state-in-setstate": "error",
        "react/no-danger": "error",
        "react/no-deprecated": "error",
        "react/no-did-mount-set-state": "error",
        "react/no-did-update-set-state": "error",
        "react/no-direct-mutation-state": "error",
        "react/no-is-mounted": "error",
        "react/no-unknown-property": "error",
        "react/require-render-return": "error",
        "require-await": "error",
        "sort-keys": "off",
        "sort-vars": "error",
        strict: "off",
        "symbol-description": "error",
        "vars-on-top": "error",
        yoda: ["error", "never"],
      },
    },
  ],
};
