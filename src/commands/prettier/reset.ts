import { Command, Flags } from "@oclif/core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

import {
  DEFAULT_CONFIG,
  DEFAULT_IGNORE_PATTERNS,
} from "../../consts/prettierrc.js";
import { require } from "../../lib/commonjs.js";
import { resolvePaths } from "../../lib/resolve.js";
import { toYamlFile } from "../../lib/to-yaml-file.js";

export default class Reset extends Command {
  static args = {};
  static description =
    "reset prettier config and ignore file,『~/.meocli/.prettierrc.yaml, ~/.meocli/.prettierignore』";
  static examples = [`<%= config.bin %> <%= command.id %> --verbose`];
  static flags = {
    verbose: Flags.boolean({
      char: "v",
      default: false,
      description: "Show verbose output",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Reset);

    const { verbose } = flags;

    if (verbose) {
      process.env.DEBUG = "oclif:me:prettier:reset";
      require("debug").enable(process.env.DEBUG);
    }

    const meocliPath = `${homedir}/.meocli`;
    const ignorePath = `${meocliPath}/.prettierignore`;
    const configPath = `${meocliPath}/.prettierrc.yaml`;

    if (!existsSync(meocliPath)) {
      mkdirSync(meocliPath);
    }

    writeFileSync(ignorePath, DEFAULT_IGNORE_PATTERNS.join("\n"), {
      encoding: "utf8",
    });
    this.debug("Prettier ignore >:", DEFAULT_IGNORE_PATTERNS);

    DEFAULT_CONFIG.plugins = resolvePaths(DEFAULT_CONFIG.plugins);
    this.debug("Prettier config >:", DEFAULT_CONFIG);
    toYamlFile(configPath, DEFAULT_CONFIG);

    this.log("✔ Prettier config and ignore file reset success!");
  }
}
