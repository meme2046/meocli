/* eslint-disable @typescript-eslint/no-explicit-any */
import { Command, Flags } from "@oclif/core";

import { getIrysUploader, listSupportedTokens } from "../../lib/irys.js";

export default class IrysReset extends Command {
  static description =
    "Irys 辅助工具：查看支持的代币列表、获取示例配置、验证私钥";
  static examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> -t ethereum",
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
    token: Flags.string({
      char: "t",
      description:
        "指定代币后，会尝试建立连接并打印钱包地址（仅验证私钥是否可用，不发交易）",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(IrysReset);

    // 指定 token：验证私钥是否可用
    if (flags.token) {
      try {
        const irys: any = await getIrysUploader({
          envPath: flags.env,
          privateKey: flags.key,
          token: flags.token,
        });
        this.log(`✓ 连接成功`);
        this.log(`  代币: ${irys.token}`);
        this.log(`  RPC: ${irys.tokenConfig?.providerUrl ?? "(default)"}`);
        this.log(`  地址: ${irys.address}`);
      } catch (error: any) {
        this.error(error.message ?? String(error));
      }

      return;
    }

    // 默认：列出支持的代币和配置示例
    const tokens = listSupportedTokens();
    this.log("支持的代币（通过 --token 指定）:");
    for (const t of tokens) {
      this.log(`  ${t}`);
    }

    this.log("");
    this.log("~/.meocli/.env 配置示例:");
    this.log("  # 默认私钥（ethereum 类代币）");
    this.log("  IRYS_PRIVATE_KEY=0x...");
    this.log("  # solana 专用（base58 编码的 keypair）");
    this.log("  IRYS_SOLANA_PRIVATE_KEY=...");
    this.log("");
    this.log("验证私钥连接: me irys reset -t ethereum");
  }
}
