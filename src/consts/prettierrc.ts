export const DEFAULT_ARGS = [
  "--arrow-parens",
  "always",
  "--bracket-same-line",
  "false",
  "--object-wrap",
  "preserve",
  "--experimental-operator-position",
  "end",
  "--no-experimental-ternaries",
  "--single-quote",
  "false",
  "--jsx-single-quote",
  "false",
  "--quote-props",
  "as-needed",
  "--trailing-comma",
  "all",
  "--single-attribute-per-line",
  "false",
  "--html-whitespace-sensitivity",
  "css",
  "--vue-indent-script-and-style",
  "false",
  "--prose-wrap",
  "preserve",
  "--end-of-line",
  "lf",
  "--insert-pragma",
  "false",
  "--print-width",
  "80",
  "--require-pragma",
  "false",
  "--tab-width",
  "2",
  "--use-tabs",
  "false",
  "--embedded-language-formatting",
  "auto",
  // plugins
  // '--plugin',
  // '@prettier/plugin-xml',
  // '--plugin',
  // 'prettier-plugin-toml',
  // '--plugin',
  // 'prettier-plugin-sh',
  // '--plugin',
  // 'prettier-plugin-nginx',
  // xml
  "--xml-whitespace-sensitivity",
  "strict",
  "--xml-sort-attributes-by-key",
  "true",
  "--xml-self-closing-space",
  "true",
  // toml
  "--indent-entries",
  "true",
  "--reorder-keys",
  "true",
  // nginx
  "--wrap-parameters",
  "false",
  "--continuation-indent",
  "2",
];

export const DEFAULT_CONFIG = {
  arrowParens: "always",
  bracketSameLine: true,
  bracketSpacing: true,
  continuationIndent: 2, // nginx
  embeddedLanguageFormatting: "auto",
  endOfLine: "lf",
  experimentalOperatorPosition: "end",
  experimentalTernaries: false,
  htmlWhitespaceSensitivity: "css",
  indentEntries: true, // toml
  insertPragma: false,
  jsxSingleQuote: false,
  objectWrap: "preserve",
  overrides: [
    { files: ["*.env"], options: { parser: "sh" } },
    { files: ["*.txt"], options: { parser: "markdown" } },
  ],
  plugins: [
    "@prettier/plugin-xml",
    "prettier-plugin-toml",
    "prettier-plugin-sh",
    "prettier-plugin-nginx",
  ],
  printWidth: 80,
  proseWrap: "preserve",
  quoteProps: "as-needed",
  reorderKeys: true, // toml
  requirePragma: false,
  semi: true,
  singleAttributePerLine: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false, // useTabs 和 tabWidth 不能同时使用
  vueIndentScriptAndStyle: false,
  wrapParameters: false, // nginx
  xmlSelfClosingSpace: true, // xml
  xmlSortAttributesByKey: true, // xml
  xmlWhitespaceSensitivity: "strict", // xml
};

// 默认的 Prettier 插件列表
export const DEFAULT_PLUGINS = [
  { main: "src/plugin.js", name: "@prettier/plugin-xml" },
  { main: "lib/index.cjs", name: "prettier-plugin-toml" },
  { main: "lib/index.cjs", name: "prettier-plugin-sh" },
  { main: "dist/index.js", name: "prettier-plugin-nginx" },
];

// 默认的忽略模式
export const DEFAULT_IGNORE_PATTERNS = [
  "node_modules/",
  "dist/",
  "build/",
  ".nyc_output/",
  "coverage/",
  ".next/",
  "out/",
  "*.nu",
];
