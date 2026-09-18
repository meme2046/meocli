import { Command, Flags } from "@oclif/core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

import { DEFAULT_BIOME_CONFIG } from "../../consts/biome.js";
import { require } from "../../lib/commonjs.js";

export default class Reset extends Command {
  static args = {};
  static description = "reset biome config file,『~/.meocli/biome.json』";
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
      process.env.DEBUG = "oclif:me:biome:reset";
      require("debug").enable(process.env.DEBUG);
    }

    const meocliPath = `${homedir}/.meocli`;
    const configPath = `${meocliPath}/biome.json`;

    if (!existsSync(meocliPath)) {
      mkdirSync(meocliPath);
    }

    this.debug("Biome config >:", DEFAULT_BIOME_CONFIG);
    writeFileSync(configPath, JSON.stringify(DEFAULT_BIOME_CONFIG, null, 2), {
      encoding: "utf8",
    });

    this.log("✓ Biome config file reset success!");
  }
}
