import { Args, Command, Flags } from "@oclif/core";
import { execa } from "execa";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { DEFAULT_BIOME_CONFIG } from "../../consts/biome.js";
import { require } from "../../lib/commonjs.js";

export default class Biome extends Command {
  static args = {
    filePath: Args.string({
      description: "file path that need to be formatted by Biome",
      required: true,
    }),
  };
  static description = `Use Biome to format file
支持 JS/TS/JSX/TSX/JSON/JSONC/CSS/GraphQL/HTML/Vue/Svelte/Astro/SVG
Biome 不支持 TOML/SH/Java/Kotlin/SQL/Nginx/PowerShell/Solidity/Motoko/XML(通用) — 这些请用 prettier 命令`;
  static examples = [
    "<%= config.bin %> <%= command.id %> ./src/file.tsx",
    "<%= config.bin %> <%= command.id %> ./src/file.tsx --config ./biome.json",
  ];
  static flags = {
    config: Flags.string({
      char: "c",
      default: "built_in",
      description:
        "built_in:使用内置规则(默认值), 传入路径则是使用自定义配置, auto:自动检测项目中的 biome.json",
      required: false,
    }),
    verbose: Flags.boolean({
      char: "v",
      default: false,
      description: "Show verbose output",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Biome);

    const { filePath } = args;
    const { config, verbose } = flags;

    if (verbose) {
      process.env.DEBUG = "oclif:me:biome";
      require("debug").enable(process.env.DEBUG);
    }

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      this.error(`file『${filePath}』not found`);
      return;
    }

    // 定位 biome 二进制 —— biome 没有 main 字段，所以用 package.json 来 resolve
    let biomeBin: string;
    try {
      const biomePkg = require.resolve("@biomejs/biome/package.json");
      biomeBin = join(dirname(biomePkg), "bin", "biome");
    } catch {
      this.error(`@biomejs/biome not found. 请先安装: pnpm add @biomejs/biome`);
      return;
    }

    if (!existsSync(biomeBin)) {
      this.error(`biome binary not found at: ${biomeBin}`);
      return;
    }

    this.debug("biome binary:", biomeBin);

    // 准备 ~/.meocli/ 目录和默认配置
    const meocliPath = `${homedir}/.meocli`;
    const configPath = `${meocliPath}/biome.json`;

    if (!existsSync(meocliPath)) {
      mkdirSync(meocliPath);
    }

    if (!existsSync(configPath)) {
      this.debug("writing default biome config to:", configPath);
      writeFileSync(configPath, JSON.stringify(DEFAULT_BIOME_CONFIG, null, 2), {
        encoding: "utf8",
      });
    }

    // 确定最终使用的配置路径
    let finalConfigPath: string;

    if (config === "built_in") {
      finalConfigPath = configPath;
    } else if (existsSync(config)) {
      finalConfigPath = config;
    } else {
      // auto: 尝试查找项目中的配置文件
      finalConfigPath = this.findProjectBiomeConfig() ?? configPath;
    }

    // 构建 biome 参数
    // biome format --write --config-path <path> --colors=off --vcs-enabled=false <file>
    const biomeArgs = [
      "format",
      "--write",
      "--colors=off",
      "--vcs-enabled=false",
      "--config-path",
      finalConfigPath,
      filePath,
    ];

    this.debug("args:", JSON.stringify(biomeArgs));

    try {
      const { stderr, stdout } = await execa(biomeBin, biomeArgs, {
        env: { ...process.env },
      });

      if (stdout) {
        this.log(stdout);
      }

      if (stderr) {
        this.warn(stderr);
      }

      this.log(`✓ Formatted ${filePath}`);
    } catch (error: unknown) {
      // biome 不支持的文件类型会报错，把错误信息暴露给用户
      if (error && typeof error === "object" && "stderr" in error) {
        const { stderr } = error as { stderr: string };
        this.error(stderr.trim());
      } else if (error instanceof Error) {
        this.error(error.message);
      } else {
        this.error("Unknown error occurred during formatting");
      }
    }
  }

  private findProjectBiomeConfig(): null | string {
    const possibleConfigs = ["biome.json", "biome.jsonc"];

    for (const configFile of possibleConfigs) {
      if (existsSync(configFile)) {
        return configFile;
      }
    }

    return null;
  }
}
