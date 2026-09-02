/* eslint-disable @typescript-eslint/no-explicit-any, new-cap, no-return-await */
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Irys 代币 → SDK 包映射。
 * 动态 import 对应的 @irys/upload-* 子包，避免静态依赖膨胀。
 */
const TOKEN_REGISTRY: Record<string, { export: string; pkg: string }> = {
  arbitrum: { export: "Arbitrum", pkg: "@irys/upload-ethereum" },
  avalanche: { export: "Avalanche", pkg: "@irys/upload-ethereum" },
  "base-eth": { export: "BaseEth", pkg: "@irys/upload-ethereum" },
  bera: { export: "Bera", pkg: "@irys/upload-ethereum" },
  bnb: { export: "BNB", pkg: "@irys/upload-ethereum" },
  chainlink: { export: "Chainlink", pkg: "@irys/upload-ethereum" },
  ethereum: { export: "Ethereum", pkg: "@irys/upload-ethereum" },
  iotex: { export: "Iotex", pkg: "@irys/upload-ethereum" },
  "linea-eth": { export: "LineaEth", pkg: "@irys/upload-ethereum" },
  matic: { export: "Matic", pkg: "@irys/upload-ethereum" },
  "scroll-eth": { export: "ScrollEth", pkg: "@irys/upload-ethereum" },
  solana: { export: "Solana", pkg: "@irys/upload-solana" },
  "usdc-eth": { export: "USDCEth", pkg: "@irys/upload-ethereum" },
  "usdc-polygon": { export: "USDCPolygon", pkg: "@irys/upload-ethereum" },
};

/** 代币别名 → 规范名（支持市值名、常见缩写等） */
const TOKEN_ALIASES: Record<string, string> = {
  arb: "arbitrum",
  avax: "avalanche",
  base: "base-eth",
  bnb: "bnb",
  bsc: "bnb",
  eth: "ethereum",
  matic: "matic",
  op: "optimism", // Irys 暂不支持 optimism 链，忽略
  pol: "matic",
  polygon: "matic",
};

/** 规范化 token：小写 + 别名映射 */
function normalizeToken(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return TOKEN_ALIASES[lower] ?? lower;
}

export function listSupportedTokens(): string[] {
  return Object.keys(TOKEN_REGISTRY);
}

function defaultEnvPath(): string {
  return join(homedir(), ".meocli", ".env");
}

/** 解析 env 文件路径，支持绝对路径和相对路径（相对 cwd） */
function resolveEnvPath(customPath?: string): string {
  if (!customPath) return defaultEnvPath();
  return resolve(customPath);
}

function loadEnv(envPath?: string): dotenv.DotenvParseOutput | undefined {
  const path = resolveEnvPath(envPath);
  if (!existsSync(path)) return undefined;
  return dotenv.config({ path }).parsed;
}

/**
 * 从 .env 读取私钥。
 * 优先匹配代币专属键：IRYS_<TOKEN>_PRIVATE_KEY（token 名称大写 + 下划线），
 * 找不到则 fallback 到通用键 IRYS_PRIVATE_KEY。
 */
export function getPrivateKey(
  token: string,
  envPath?: string,
): string | undefined {
  const env = loadEnv(envPath);
  if (!env) return undefined;
  const suffix = token.toUpperCase().replaceAll("-", "_");
  const specific = env[`IRYS_${suffix}_PRIVATE_KEY`];
  return specific ?? env.IRYS_PRIVATE_KEY;
}

export interface IrysConnectOptions {
  /** 自定义 .env 文件路径（默认 ~/.meocli/.env） */
  envPath?: string;
  /** mainnet（默认）或 devnet */
  network?: "devnet" | "mainnet";
  /** 直接传入私钥，跳过 .env 读取 */
  privateKey?: string;
  /** 自定义 RPC URL（devnet 或自定义链时常用） */
  rpcUrl?: string;
  /** 代币名，默认 ethereum */
  token?: string;
}

/**
 * 构建一个 Irys Uploader 实例。
 * - 根据 token 动态 import 对应的 @irys/upload-* 包
 * - 私钥优先级：opts.privateKey > opts.envPath 指定文件的代币专属键 > 通用键
 */
export async function getIrysUploader(
  opts: IrysConnectOptions = {},
): Promise<any> {
  const rawToken = opts.token ?? "ethereum";
  const tokenName = normalizeToken(rawToken);
  const network = opts.network ?? "mainnet";
  const resolvedEnvPath = resolveEnvPath(opts.envPath);

  const registry = TOKEN_REGISTRY[tokenName];
  if (!registry) {
    throw new Error(
      `Unsupported token '${rawToken}'. Supported tokens: ${listSupportedTokens().join(", ")}`,
    );
  }

  const privateKey = opts.privateKey ?? getPrivateKey(tokenName, opts.envPath);
  if (!privateKey) {
    const suffix = tokenName.toUpperCase().replaceAll("-", "_");
    throw new Error(
      `Private key not found for token '${tokenName}'. ` +
        `Please set IRYS_${suffix}_PRIVATE_KEY or IRYS_PRIVATE_KEY in ${resolvedEnvPath}`,
    );
  }

  // 动态加载代币包 & Uploader 工厂
  const tokenModule = await import(registry.pkg);
  const TokenClass = tokenModule[registry.export];
  if (!TokenClass) {
    throw new Error(`Export '${registry.export}' not found in ${registry.pkg}`);
  }

  // 各链默认 RPC override——修补 SDK 内置的已失效/不稳定 RPC
  // polygon-rpc.com (SDK 默认) 2026 年中起要求 API key，故切到官方新默认 drpc.org
  const CHAIN_RPC_DEFAULTS: Record<string, string> = {
    matic: "https://polygon.drpc.org",
  };

  const { Uploader } = await import("@irys/upload");
  // Uploader 是函数工厂但以大写命名，绕过 new-cap
  let builder: any = Uploader(TokenClass).withWallet(privateKey);

  // Builder 有 Promise contract，await 会自动触发 build()
  builder = network === "devnet" ? builder.devnet() : builder.mainnet();

  // 用户显式传 -r 优先；否则用我们内置的 fallback 覆盖 SDK 的旧 RPC
  const effectiveRpc = opts.rpcUrl ?? CHAIN_RPC_DEFAULTS[tokenName];
  if (effectiveRpc) {
    builder = builder.withRpc(effectiveRpc);
  }

  return await builder;
}
