/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
import { defineConfig } from "vite-plus";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import { partytownVite } from "@qwik.dev/partytown/utils";
import { getPlatformProxy } from "wrangler";
import pkg from "./package.json" with { type: "json" };

type PkgDep = Record<string, string>;
const { dependencies = {}, devDependencies = {} } = pkg as any as {
  dependencies: PkgDep;
  devDependencies: PkgDep;
  [key: string]: unknown;
};
errorOnDuplicatesPkgDeps(devDependencies, dependencies);

/**
 * Note that Vite normally starts from `index.html` but the qwikCity plugin makes start at `src/entry.ssr.tsx` instead.
 */
const needsPlatform = process.argv.some(
  (a) => a === "dev" || a === "serve" || a === "preview",
);
const platform = needsPlatform
  ? await getPlatformProxy<Env>({
    persist: { path: ".wrangler/state/v3" },
  })
  : undefined;

if (platform) {
  globalThis.__OHEYA_PLATFORM__ = platform;
}

export default defineConfig({
  staged: {
    "*": ["vp check --fix", () => "vp run build.types"],
  },
  lint: {
    plugins: ["typescript", "import"],
    jsPlugins: ["eslint-plugin-qwik"],
    categories: {
      correctness: "off",
    },
    env: {
      builtin: true,
      browser: true,
      es2024: true,
      node: true,
      serviceworker: true,
    },
    globals: {
      AudioWorkletGlobalScope: "readonly",
      AudioWorkletProcessor: "readonly",
      currentFrame: "readonly",
      currentTime: "readonly",
      registerProcessor: "readonly",
      sampleRate: "readonly",
      WorkletGlobalScope: "readonly",
    },
    ignorePatterns: [
      "**/*.log",
      "**/.DS_Store",
      "**/*.",
      ".vscode/settings.json",
      "**/.history",
      "**/.yarn",
      "**/bazel-*",
      "**/bazel-bin",
      "**/bazel-out",
      "**/bazel-qwik",
      "**/bazel-testlogs",
      "**/dist",
      "**/dist-dev",
      "**/lib",
      "**/lib-types",
      "**/etc",
      "**/external",
      "**/node_modules",
      "**/temp",
      "**/tsc-out",
      "**/tsdoc-metadata.json",
      "**/target",
      "**/output",
      "**/rollup.config.js",
      "**/build",
      "**/.cache",
      "**/.vscode",
      "**/.rollup.cache",
      "**/tsconfig.tsbuildinfo",
      "**/vite.config.ts",
      "**/*.spec.tsx",
      "**/*.spec.ts",
      "**/.netlify",
      "**/pnpm-lock.yaml",
      "**/package-lock.json",
      "**/yarn.lock",
      "/server",
      "/scripts",
      "eslint.config.js",
    ],
    rules: {
      "constructor-super": "error",
      "for-direction": "error",
      "no-async-promise-executor": "error",
      "no-case-declarations": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-empty-static-block": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-import-assign": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-new-native-nonconstructor": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-obj-calls": "error",
      "no-prototype-builtins": "error",
      "no-redeclare": "error",
      "no-regex-spaces": "error",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-unexpected-multiline": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": "error",
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      "no-with": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-array-constructor": "error",
      "no-unused-expressions": "error",
      "qwik/valid-lexical-scope": "off",
      "qwik/use-method-usage": "error",
      "qwik/no-react-props": "error",
      "qwik/loader-location": "warn",
      "qwik/prefer-classlist": "warn",
      "qwik/jsx-no-script-url": "warn",
      "qwik/jsx-key": "warn",
      "qwik/unused-server": "error",
      "qwik/jsx-img": "warn",
      "qwik/jsx-a": "warn",
      "qwik/no-use-visible-task": "warn",
      "qwik/no-async-prevent-default": "warn",
      "typescript/ban-ts-comment": "error",
      "typescript/no-duplicate-enum-values": "error",
      "typescript/no-empty-object-type": "error",
      "typescript/no-extra-non-null-assertion": "error",
      "typescript/no-misused-new": "error",
      "typescript/no-namespace": "error",
      "typescript/no-non-null-asserted-optional-chain": "error",
      "typescript/no-require-imports": "error",
      "typescript/no-this-alias": "error",
      "typescript/no-unnecessary-type-constraint": "error",
      "typescript/no-unsafe-declaration-merging": "error",
      "typescript/no-unsafe-function-type": "error",
      "typescript/no-wrapper-object-types": "error",
      "typescript/prefer-as-const": "error",
      "typescript/prefer-namespace-keyword": "error",
      "typescript/triple-slash-reference": "error",
      "import/no-relative-parent-imports": "error",
    },
    overrides: [
      {
        files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
        rules: {
          "constructor-super": "off",
          "no-class-assign": "off",
          "no-const-assign": "off",
          "no-dupe-class-members": "off",
          "no-dupe-keys": "off",
          "no-func-assign": "off",
          "no-import-assign": "off",
          "no-new-native-nonconstructor": "off",
          "no-obj-calls": "off",
          "no-redeclare": "off",
          "no-setter-return": "off",
          "no-this-before-super": "off",
          "no-unsafe-negation": "off",
          "no-var": "error",
          "no-with": "off",
          "prefer-const": "error",
          "prefer-rest-params": "error",
          "prefer-spread": "error",
        },
      },
    ],
  },
  fmt: {
    ignorePatterns: [
      "**/*.log",
      "**/.DS_Store",
      "*.",
      ".vscode/settings.json",
      ".history",
      ".yarn",
      "bazel-*",
      "bazel-bin",
      "bazel-out",
      "bazel-qwik",
      "bazel-testlogs",
      "dist",
      "dist-dev",
      "lib",
      "lib-types",
      "etc",
      "external",
      "node_modules",
      "temp",
      "tsc-out",
      "tsdoc-metadata.json",
      "target",
      "output",
      "rollup.config.js",
      "build",
      ".cache",
      ".vscode",
      ".rollup.cache",
      "tsconfig.tsbuildinfo",
      "vite.config.ts",
      "*.spec.tsx",
      "*.spec.ts",
      ".netlify",
      "pnpm-lock.yaml",
      "package-lock.json",
      "yarn.lock",
      "/server",
    ],
  },
  plugins: [
    partytownVite({}),
    qwikCity({ platform: platform ? { env: platform.env, cf: platform.cf, ctx: platform.ctx, caches: platform.caches } : undefined }),
    qwikVite(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  oxc: false,
  // This tells Vite which dependencies to pre-build in dev mode.
  optimizeDeps: {
    // Put problematic deps that break bundling here, mostly those with binaries.
    // For example ['better-sqlite3'] if you use that in server functions.
    exclude: [],
  },

  /**
   * This is an advanced setting. It improves the bundling of your server code. To use it, make sure you understand when your consumed packages are dependencies or dev dependencies. (otherwise things will break in production)
   */
  // ssr:
  //   command === "build" && mode === "production"
  //     ? {
  //         // All dev dependencies should be bundled in the server build
  //         noExternal: Object.keys(devDependencies),
  //         // Anything marked as a dependency will not be bundled
  //         // These should only be production binary deps (including deps of deps), CLI deps, and their module graph
  //         // If a dep-of-dep needs to be external, add it here
  //         // For example, if something uses `bcrypt` but you don't have it as a dep, you can write
  //         // external: [...Object.keys(dependencies), 'bcrypt']
  //         external: Object.keys(dependencies),
  //       }
  //     : undefined,

  server: {
    headers: {
      // Don't cache the server response in dev mode
      "Cache-Control": "public, max-age=0",
    },
  },
  preview: {
    headers: {
      // Do cache the server response in preview (non-adapter production build)
      "Cache-Control": "public, max-age=600",
    },
  },
});

// *** utils ***

/**
 * Function to identify duplicate dependencies and throw an error
 * @param {Object} devDependencies - List of development dependencies
 * @param {Object} dependencies - List of production dependencies
 */
function errorOnDuplicatesPkgDeps(
  devDependencies: PkgDep,
  dependencies: PkgDep,
) {
  let msg = "";
  // Create an array 'duplicateDeps' by filtering devDependencies.
  // If a dependency also exists in dependencies, it is considered a duplicate.
  const duplicateDeps = Object.keys(devDependencies).filter(
    (dep) => dependencies[dep],
  );

  // include any known qwik packages
  const qwikPkg = Object.keys(dependencies).filter((value) =>
    /qwik/i.test(value),
  );

  // any errors for missing "qwik-city-plan"
  // [PLUGIN_ERROR]: Invalid module "@qwik-city-plan" is not a valid package
  msg = `Move qwik packages ${qwikPkg.join(", ")} to devDependencies`;

  if (qwikPkg.length > 0) {
    throw new Error(msg);
  }

  // Format the error message with the duplicates list.
  // The `join` function is used to represent the elements of the 'duplicateDeps' array as a comma-separated string.
  msg = `
    Warning: The dependency "${duplicateDeps.join(", ")}" is listed in both "devDependencies" and "dependencies".
    Please move the duplicated dependencies to "devDependencies" only and remove it from "dependencies"
  `;

  // Throw an error with the constructed message.
  if (duplicateDeps.length > 0) {
    throw new Error(msg);
  }
}
