// Biome 默认配置 —— 由 prettier 默认配置映射而来
// biome.json 是 JSON 格式，不像 prettier 支持 YAML

export const DEFAULT_BIOME_CONFIG = {
  $schema: "https://biomejs.dev/schemas/2.5.14/schema.json",
  css: {
    formatter: {
      enabled: true,
    },
  },
  files: {
    ignoreUnknown: true, // 忽略 biome 不认识的文件类型，不报错
  },
  formatter: {
    enabled: true,
    indentStyle: "space",
    indentWidth: 2,
    lineEnding: "lf",
    lineWidth: 80,
    trailingNewline: true,
  },
  graphql: {
    formatter: {
      enabled: true,
    },
  },
  html: {
    formatter: {
      enabled: true,
    },
  },
  javascript: {
    formatter: {
      arrowParentheses: "always",
      bracketSameLine: true,
      bracketSpacing: true,
      enabled: true,
      quoteStyle: "double",
      semicolons: "always",
      trailingCommas: "all",
    },
  },
  json: {
    formatter: {
      enabled: true,
      trailingCommas: "none",
    },
  },
};
