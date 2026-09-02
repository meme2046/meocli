/* eslint-disable @typescript-eslint/no-explicit-any */
import { Args, Command, Flags } from "@oclif/core";

import { getIrysUploader } from "../../lib/irys.js";

/** 给 async 操作加超时——ethers.js sendTransaction 自身没超时 */
function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `${msg}（${ms / 1000}秒超时）。可能是 RPC 不可用，请用 -r 指定可靠 RPC，或确认钱包余额足够`,
            ),
          ),
        ms,
      );
    }),
  ]);
}

export default class Fund extends Command {
  static args = {
    amount: Args.string({
      description: `充值金额。支持两种格式:
  · 十进制（如 0.05）— 自动换算为原子单位
  · 原子单位（如 50000000000000000）— 末尾加 'u' 后缀，如 50000000000000000u`,
      required: true,
    }),
  };
  static description = "向 Irys bundler 充值";
  static examples = [
    "<%= config.bin %> <%= command.id %> 0.05",
    "<%= config.bin %> <%= command.id %> 50000000000000000u",
    "<%= config.bin %> <%= command.id %> 1 -t solana -n devnet",
  ];
  static flags = {
    env: Flags.string({
      char: "e",
      description: "自定义 .env 文件路径（默认 ~/.meocli/.env）",
    }),
    key: Flags.string({
      char: "k",
      description: "私钥。不传则从 ~/.meocli/.env 读取",
    }),
    multiplier: Flags.string({
      default: "1.0",
      description: "gas fee multiplier（特定代币支持）",
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
    const { args, flags } = await this.parse(Fund);

    const irys: any = await getIrysUploader({
      envPath: flags.env,
      network: flags.network as "devnet" | "mainnet",
      privateKey: flags.key,
      rpcUrl: flags["rpc-url"],
      token: flags.token,
    });

    // 解析金额
    const rawAmount: string = args.amount;
    const isAtomic = rawAmount.endsWith("u");
    const numeric = isAtomic ? rawAmount.slice(0, -1) : rawAmount;
    const decimal = Number(numeric);
    if (Number.isNaN(decimal) || decimal <= 0) {
      this.error(`无效金额: ${rawAmount}`);
    }

    const atomic = isAtomic
      ? BigInt(numeric).toString()
      : irys.utils.toAtomic(decimal).toFixed(0);

    this.log(`代币: ${flags.token}`);
    this.log(`网络: ${flags.network}`);
    this.log(`RPC: ${irys.tokenConfig?.providerUrl ?? "(default)"}`);
    this.log(`地址: ${irys.address}`);
    this.log(
      `金额: ${isAtomic ? atomic : decimal + " (dec)"} → ${atomic} (atomic)`,
    );

    this.log("发送交易中...");
    const receipt: any = await withTimeout(
      irys.fund(atomic, Number(flags.multiplier)),
      90_000,
      "fund 链上交易未完成",
    );

    this.log(`✔ 充值成功`);
    this.log(
      `  数量: ${irys.utils.fromAtomic(receipt.quantity).toFixed(0)} ${flags.token}`,
    );
    this.log(`  Tx ID: ${receipt.id}`);
  }
}
