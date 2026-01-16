import { existsSync } from "node:fs";
import { join } from "node:path";

import { require } from "./commonjs.js";
export function resolvePaths(names: string[]): string[] {
  return names.map((name) => {
    // 尝试查找插件的实际路径
    const rPath = require.resolve(name);
    if (existsSync(rPath)) {
      return rPath;
    }

    // 如果插件路径不存在，则返回原始名称（让 prettier 自己处理）
    return name;
  });
}

export function resolvePluginArgs(
  plugins: { main: string; name: string }[],
): string[] {
  const pluginArgs = [];

  for (const plugin of plugins) {
    const pluginPath = require.resolve(plugin.name);
    if (existsSync(pluginPath)) {
      pluginArgs.push("--plugin", pluginPath);
    } else {
      pluginArgs.push("--plugin", plugin.name);
    }
  }

  return pluginArgs;
}

// 将插件名称转换为绝对路径
export function resolvePluginPaths(
  plugins: { main: string; name: string }[],
  projectRoot: string,
): string[] {
  return plugins.map((plugin) => {
    // 查找插件的实际路径
    const pluginPath = join(
      projectRoot,
      "node_modules",
      plugin.name,
      plugin.main,
    );
    if (existsSync(pluginPath)) {
      return pluginPath;
    }

    // 如果插件路径不存在，则返回原始名称（让 prettier 自己处理）
    return plugin.name;
  });
}
