/* eslint-disable @typescript-eslint/no-explicit-any */
import { Args, Command, Flags } from "@oclif/core";
import { existsSync, statSync } from "node:fs";

import { getIrysUploader } from "../../lib/irys.js";

function parseTags(
  raw?: string,
): undefined | { name: string; value: string }[] {
  if (!raw) return undefined;
  return raw.split(",").map((kv) => {
    const [name, ...rest] = kv.trim().split("=");
    const value = rest.join("=");
    if (!name || !value) {
      throw new Error(`tag 格式错误: "${kv}"，应为 name=value`);
    }

    return { name, value };
  });
}

export default class Upload extends Command {
  static args = {
    path: Args.string({
      description: "要上传的文件或目录路径，或 --text 模式下的纯文本内容",
      required: true,
    }),
  };
  static description = "上传文件、目录或文本到 Irys";
  static examples = [
    "<%= config.bin %> <%= command.id %> ./myImage.png",
    "<%= config.bin %> <%= command.id %> ./dist",
    "<%= config.bin %> <%= command.id %> ./myImage.png -t solana --tags type=image,lang=zh",
    "<%= config.bin %> <%= command.id %> 'hello irys' --text",
  ];
  static flags = {
    anchor: Flags.string({
      description:
        "仅 --text 模式：指定 deterministic anchor 值（默认自动生成）。用于可重复的数据 item ID",
    }),
    "batch-size": Flags.integer({
      default: 50,
      description: "上传目录时并发上传数量",
    }),
    env: Flags.string({
      char: "e",
      description: "自定义 .env 文件路径（默认 ~/.meocli/.env）",
    }),
    "index-file": Flags.string({
      description: "上传目录时指定 index 文件（如 index.html），用于 manifest",
    }),
    key: Flags.string({
      char: "k",
      description: "私钥。不传则从 ~/.meocli/.env 读取",
    }),
    "manifest-tags": Flags.string({
      description:
        "上传目录时，添加到 manifest 事务本身的 tags（格式同 --tags）。与 --tags（每个文件的 tag）分开",
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
    tags: Flags.string({
      description:
        "元数据 tags（上传文本 / 文件时直接应用；上传目录时作用于每个文件），格式: name1=value1,name2=value2",
    }),
    text: Flags.boolean({
      default: false,
      description:
        "将 path 参数视为纯文本内容上传，而非文件路径（绕过文件系统查找）",
    }),
    token: Flags.string({
      char: "t",
      default: "ethereum",
      description: "支付代币",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Upload);

    const irys: any = await getIrysUploader({
      envPath: flags.env,
      network: flags.network as "devnet" | "mainnet",
      privateKey: flags.key,
      rpcUrl: flags["rpc-url"],
      token: flags.token,
    });

    const tags = parseTags(flags.tags);
    const manifestTags = parseTags(flags["manifest-tags"]);

    // 1. --text 模式：直接上传字符串
    if (flags.text) {
      this.log(`上传文本 (${args.path.length} 字符)`);
      const receipt = await irys.upload(args.path, {
        anchor: flags.anchor,
        tags,
      });
      this.log(`✓ 文本上传成功`);
      this.log(`  ID: ${receipt.id}`);
      this.log(`  URL: https://gateway.irys.xyz/${receipt.id}`);
      return;
    }

    const { path } = args;
    if (!existsSync(path)) {
      this.error(`路径不存在: ${path}`);
      return;
    }

    // 2. 文件：uploadFile
    const stat = statSync(path);
    if (!stat.isDirectory()) {
      this.log(`上传文件: ${path} (${stat.size} bytes)`);
      const price = await irys.getPrice(stat.size);
      this.log(
        `预估费用: ${irys.utils.fromAtomic(price).toFixed(0)} ${flags.token}`,
      );
      const receipt = await irys.uploadFile(path, { tags });
      this.log(`✓ 文件上传成功`);
      this.log(`ID: ${receipt.id}`);
      this.log(`URL: https://gateway.irys.xyz/${receipt.id}`);
      return;
    }

    // 3. 目录：uploadFolder
    this.log(`上传目录: ${path}`);
    // SDK uploadFolder 不接受 tags 参数；per-file tags 通过 itemOptions 传递
    const itemOptions = tags ? { tags } : undefined;
    const manifest = await irys.uploadFolder(path, {
      batchSize: flags["batch-size"],
      indexFile: flags["index-file"] ?? "",
      itemOptions,
      keepDeleted: false,
      manifestTags,
    });
    this.log(`✓ 目录上传成功`);
    this.log(`Manifest ID: ${manifest.id}`);
    this.log(`URL: https://gateway.irys.xyz/${manifest.id}/`);
  }
}
