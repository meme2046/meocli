export const DEFAULT_ARGS = [
  '--arrow-parens=always',
  '--bracket-same-line=false',
  '--object-wrap=preserve',
  '--experimental-operator-position=end',
  '--no-experimental-ternaries',
  '--single-quote=false',
  '--jsx-single-quote=false',
  '--quote-props=as-needed',
  '--trailing-comma=all',
  '--single-attribute-per-line=false',
  '--html-whitespace-sensitivity=css',
  '--vue-indent-script-and-style=false',
  '--prose-wrap=preserve',
  '--end-of-line=lf',
  '--insert-pragma=false',
  '--print-width=80',
  '--require-pragma=false',
  '--tab-width=2',
  '--use-tabs=false',
  '--embedded-language-formatting=auto',
  // plugins
  '--plugin=@prettier/plugin-xml',
  '--plugin=prettier-plugin-toml',
  '--plugin=prettier-plugin-sh',
  '--plugin=prettier-plugin-nginx',
  // xml
  '--xml-whitespace-sensitivity=strict',
  '--xml-sort-attributes-by-key=true',
  '--xml-self-closing-space=true',
  // toml
  '--indent-entries=true',
  '--reorder-keys=true',
  // nginx
  '--wrap-parameters=false',
  '--continuation-indent=2',
]

// 默认的 Prettier 插件列表
export const DEFAULT_PLUGINS = [
  '@prettier/plugin-xml',
  'prettier-plugin-toml',
  'prettier-plugin-nginx',
  'prettier-plugin-sh',
]

// 默认的忽略模式
export const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/',
  'dist/',
  'build/',
  '.nyc_output/',
  'coverage/',
  '.next/',
  'out/',
]
