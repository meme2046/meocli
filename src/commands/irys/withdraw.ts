/* eslint-disable @typescript-eslint/no-explicit-any */
import { Args, Command, Flags } from "@oclif/core";

import { getIrysUploader } from "../../lib/irys.js";

export default class Withdraw extends Command {
  static args = {
    amount: Args.string({
      description: `提现金额（十进制）或原子单位（末尾 'u' 后缀，如 1000000u）。搭配 --all 时可省略`,
      required: false,
    }),
  };
  static description = "从 Irys bundler 提现余额回到链上钱包";
  static examples = [
    "<%= config.bin %> <%= command.id %> 0.01",
    "<%= config.bin %> <%= command.id %> 1000000000000000u",
    "<%= config.bin %> <%= command.id %> --all",
    "<%= config.bin %> <%= command.id %> 0.1 -t solana -n devnet",
  ];
  static flags = {
    all: Flags.boolean({
      default: false,
      description: "提现全部余额（调用 withdrawAll）。指定后 amount 参数可省略",
    }),
    env: Flags.string({
      char: "e",
      description: "自定义 .env 文件路径（默认 ~/.meocli/.env）",
    }),
    key: Flags.string({
      char: "k",
      description: "私钥。不传则从 ~/.meocli/.env 读取",
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
      description: "代币（提现只对当前代币余额生效）",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Withdraw);

    const irys: any = await getIrysUploader({
      envPath: flags.env,
      network: flags.network as "devnet" | "mainnet",
      privateKey: flags.key,
      rpcUrl: flags["rpc-url"],
      token: flags.token,
    });

    this.log(`代币: ${flags.token}`);
    this.log(`网络: ${flags.network}`);
    this.log(`RPC: ${irys.tokenConfig?.providerUrl ?? "(default)"}`);
    this.log(`地址: ${irys.address}`);

    if (flags.all) {
      this.log("提现全部余额...");
      const res = await irys.withdrawAll();
      this.log(`✓ 提现成功`);
      this.log(`  Tx ID: ${res["tx-id"] ?? res.id ?? "(pending)"}`);
      this.log(
        `  Requested: ${irys.utils.fromAtomic(res.requested).toFixed(0)} ${flags.token}`,
      );
      this.log(
        `  Fee: ${irys.utils.fromAtomic(res.fee).toFixed(0)} ${flags.token}`,
      );
      this.log(
        `  Final: ${irys.utils.fromAtomic(res.final).toFixed(0)} ${flags.token}`,
      );
      return;
    }

    if (!args.amount) {
      this.error("需要提供提现金额，或使用 --all 提现全部");
      return;
    }

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

    this.log(
      `提现: ${isAtomic ? atomic : decimal + " (dec)"} → ${atomic} (atomic)`,
    );

    this.log("发送提现请求中...");
    const res = await irys.withdrawBalance(atomic);
    this.log(`✓ 提现成功`);
    this.log(`  Tx ID: ${res["tx-id"] ?? res.id ?? "(pending)"}`);
    this.log(
      `  Requested: ${irys.utils.fromAtomic(res.requested).toFixed(0)} ${flags.token}`,
    );
    this.log(
      `  Fee: ${irys.utils.fromAtomic(res.fee).toFixed(0)} ${flags.token}`,
    );
    this.log(
      `  Final: ${irys.utils.fromAtomic(res.final).toFixed(0)} ${flags.token}`,
    );
  }
}
