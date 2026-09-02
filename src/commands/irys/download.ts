/* eslint-disable @typescript-eslint/no-explicit-any, n/no-unsupported-features/node-builtins */
import { Args, Command, Flags } from "@oclif/core";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export default class Download extends Command {
  static args = {
    id: Args.string({
      description: "Irys 事务 ID（transaction ID）",
      required: true,
    }),
  };
  static description = "从 Irys gateway 下载数据";
  static examples = [
    "<%= config.bin %> <%= command.id %> CO9EpX0lekJEfXUOeXncUmMuG8eEp5WJHXl9U9yZUYA",
    "<%= config.bin %> <%= command.id %> CO9EpX0lekJEfXUOeXncUmMuG8eEp5WJHXl9U9yZUYA -o ./image.png",
    "<%= config.bin %> <%= command.id %> CO9EpX0lekJEfXUOeXncUmMuG8eEp5WJHXl9U9yZUYA --devnet",
  ];
  static flags = {
    devnet: Flags.boolean({
      default: false,
      description: "从 devnet gateway 下载（数据留存 ~60 天）",
    }),
    output: Flags.string({
      char: "o",
      description:
        "保存到文件（不传则打印到 stdout）。目录形式会自动用 ID 作文件名",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Download);

    const gateway = flags.devnet
      ? "https://devnet.irys.xyz"
      : "https://gateway.irys.xyz";
    const url = `${gateway}/${args.id}`;

    this.log(`下载: ${url}`);

    let res: Response;
    try {
      res = await fetch(url);
    } catch (error: any) {
      this.error(`网络错误: ${error.message ?? String(error)}`);
      return;
    }

    if (!res.ok) {
      this.error(`下载失败: HTTP ${res.status} ${res.statusText}`);
      return;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await res.arrayBuffer());
    this.log(`✔ 下载成功 (${buffer.length} bytes, ${contentType})`);

    if (flags.output) {
      const outPath =
        flags.output.endsWith("/") || flags.output.endsWith("\\")
          ? join(flags.output, args.id)
          : flags.output;
      writeFileSync(outPath, buffer);
      this.log(`  已保存到: ${outPath}`);
      return;
    }

    // 尝试文本输出
    if (
      contentType.startsWith("text/") ||
      contentType.includes("json") ||
      buffer.length < 4096
    ) {
      this.log("--- 内容 ---");
      process.stdout.write(buffer.toString("utf8"));
      process.stdout.write("\n--- end ---\n");
    } else {
      // 二进制且没指定 -o，提示用户
      this.error(
        `二进制数据 (${contentType}, ${buffer.length} bytes) 未保存。请使用 -o 指定输出路径`,
      );
    }
  }
}
