import { Args, Command, Flags } from "@oclif/core";
import dotenv from "dotenv";
import { existsSync } from "node:fs";

import { require } from "../../lib/commonjs.js";

export default class Env extends Command {
  static args = {
    filePath: Args.string({
      default: ".env",
      description: ".env文件路径,不传默认值为.env",
      required: false,
    }),
  };
  static description =
    "读取.env环境变量,返回DotenvParseOutput:{[name: string]: string;}";
  static examples = [
    `
    <%= config.bin %> <%= command.id %> .env
    `,
  ];
  static flags = {
    verbose: Flags.boolean({
      char: "v",
      default: false,
      description: "Show verbose output",
    }),
  };

  async run(): Promise<dotenv.DotenvParseOutput | undefined> {
    const { args, flags } = await this.parse(Env);

    const { filePath } = args;
    const { verbose } = flags;

    if (!existsSync(filePath)) {
      this.log(`✘ 『${filePath}』 not found!`);
      return undefined;
    }

    if (verbose) {
      process.env.DEBUG = "oclif:me:env";
      require("debug").enable(process.env.DEBUG);
    }

    const envConfig: dotenv.DotenvParseOutput | undefined = dotenv.config({
      path: filePath,
    }).parsed;

    if (envConfig) {
      this.debug(`✔ 『${filePath}』\n`, envConfig);
    }

    return envConfig;
  }
}
