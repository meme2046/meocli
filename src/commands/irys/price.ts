/* eslint-disable @typescript-eslint/no-explicit-any */
import { Args, Command, Flags } from "@oclif/core";
import { existsSync, statSync } from "node:fs";

import { getIrysUploader } from "../../lib/irys.js";

export default class Price extends Command {
  static args = {
    bytes: Args.string({
      description:
        "要预估费用的字节数。也可以用 --file 指定文件路径自动计算。100 KiB 以下免费",
      required: false,
    }),
  };
  static description = "预估上传指定大小数据到 Irys 的费用";
  static examples = [
    "<%= config.bin %> <%= command.id %> 1048576",
    "<%= config.bin %> <%= command.id %> --file ./myImage.png",
    "<%= config.bin %> <%= command.id %> 1048576 -t solana",
  ];
  static flags = {
    env: Flags.string({
      char: "e",
      description: "自定义 .env 文件路径（默认 ~/.meocli/.env）",
    }),
    file: Flags.string({
      char: "f",
      description: "指定文件路径，自动读取字节数（覆盖 bytes 参数）",
    }),
    key: Flags.string({
      char: "k",
      description: "私钥（此命令仅读公开接口，可不提供）",
    }),
    network: Flags.string({
      char: "n",
      default: "mainnet",
      description: "网络",
      options: ["mainnet", "devnet"],
    }),
    "rpc-url": Flags.string({
      char: "r",
      description: "自定义 RPC URL（devnet 必需）",
    }),
    token: Flags.string({
      char: "t",
      default: "ethereum",
      description: "支付代币",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Price);

    let numBytes: number;
    if (flags.file) {
      if (!existsSync(flags.file)) {
        this.error(`文件不存在: ${flags.file}`);
        return;
      }

      numBytes = statSync(flags.file).size;
      this.log(`文件: ${flags.file} (${numBytes} bytes)`);
    } else if (args.bytes) {
      numBytes = Number(args.bytes);
      if (!Number.isFinite(numBytes) || numBytes < 0) {
        this.error(`无效字节数: ${args.bytes}`);
        return;
      }
    } else {
      this.error("需要提供字节数参数，或使用 --file 指定文件路径");
      return;
    }

    // 100 KiB 以下免费
    if (numBytes < 102_400) {
      this.log("✔ 小于 100 KiB，上传免费");
      return;
    }

    const irys: any = await getIrysUploader({
      envPath: flags.env,
      network: flags.network as "devnet" | "mainnet",
      privateKey: flags.key,
      rpcUrl: flags["rpc-url"],
      token: flags.token,
    });

    const price = await irys.getPrice(numBytes);
    const standard = irys.utils.fromAtomic(price);

    this.log(`代币: ${flags.token}`);
    this.log(`网络: ${flags.network}`);
    this.log(`RPC: ${irys.tokenConfig?.providerUrl ?? "(default)"}`);
    this.log(`预估费用 (${numBytes} bytes):`);
    this.log(`  ${price.toString()} atomic`);
    this.log(`  ${standard.toFixed(6)} ${flags.token}`);
  }
}
