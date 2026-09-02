import { Args, Command, Flags } from "@oclif/core";

import { getIrysUploader } from "../../lib/irys.js";

export default class Balance extends Command {
  static args = {
    address: Args.string({
      description:
        "要查询的地址。不传则查询 ~/.meocli/.env 中配置的私钥对应地址",
      required: false,
    }),
  };
  static description = "查询 Irys bundler 上的账户余额";
  static examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> 0x591B5Ce7cA10a55A9B5d1516eF89693D5b3586b8",
    "<%= config.bin %> <%= command.id %> -t solana -n devnet",
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
    network: Flags.string({
      char: "n",
      default: "mainnet",
      description: "网络：mainnet 或 devnet",
      options: ["mainnet", "devnet"],
    }),
    "rpc-url": Flags.string({
      char: "r",
      description: "自定义 RPC URL（devnet 或自定义链时常用）",
    }),
    token: Flags.string({
      char: "t",
      default: "ethereum",
      description: `支付代币，支持的代币请用 me irys 查看`,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Balance);

    const irys = await getIrysUploader({
      envPath: flags.env,
      network: flags.network as "devnet" | "mainnet",
      privateKey: flags.key,
      rpcUrl: flags["rpc-url"],
      token: flags.token,
    });

    const queryAddress = args.address ?? irys.address;
    this.log(`查询中... (token=${flags.token}, network=${flags.network})`);
    this.log(`RPC: ${irys.tokenConfig?.providerUrl ?? "(default)"}`);
    this.log(`地址: ${queryAddress}`);

    const balance = await irys.getBalance(queryAddress);
    const readable = irys.utils.fromAtomic(balance).toFixed(0);

    this.log(`余额: ${balance} (atomic) / ${readable} ${flags.token}`);
  }
}
