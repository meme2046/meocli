import lodash from "lodash";
import fs from "node:fs";
import { EMA, MACD, MACDResult, SMA } from "trading-signals";

const { isNull, round, toNumber } = lodash;

// 从文件读取binance K线数据
const jsonData = JSON.parse(
  fs.readFileSync("d:/github/meme2046/meocli/tmp/tmp.json", "utf8"),
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testSMA() {
  // 提取收盘价数据（每个K线数组的第4个元素，索引为4）
  const closePrices = jsonData.map((kline: number[]) => toNumber(kline[4]));

  // 创建SMA实例，设置周期为7
  const sma = new SMA(7);
  const smaResults: (null | number)[] = [];

  // 实现批量添加数据的方法
  // function updateSMA(sma: SMA, prices: number[]): (null | number)[] {
  //   const results: (null | number)[] = [];
  //   for (const price of prices) {
  //     sma.add(price);
  //     const result = sma.getResult();
  //     results.push(result);
  //   }

  //   return results;
  // }

  // 使用批量更新方法
  // const smaResults2 = updateSMA(new SMA(7), closePrices);
  // console.log("批量更新SMA(7)结果长度:", smaResults2.length);
  // console.log("批量更新最后一个SMA(7)结果:", smaResults2.at(-1));
  // 添加所有收盘价数据
  for (const price of closePrices) {
    sma.add(price);
    const result = sma.getResult();
    if (isNull(result)) {
      smaResults.push(null);
    } else {
      smaResults.push(round(result, 2));
    }
  }

  return smaResults;
}

function testMACD() {
  // 提取收盘价数据
  const closePrices = jsonData.map((kline: number[]) => toNumber(kline[4]));

  // 创建MACD实例 (参数: short=12, long=26, signal=9)
  const short = new EMA(12);
  const long = new EMA(26);
  const signal = new EMA(9);
  const macd = new MACD(short, long, signal);
  const macdResults: (MACDResult | null)[] = [];

  // 添加所有收盘价数据
  for (const price of closePrices) {
    macd.add(price);
    const result = macd.getResult();
    macdResults.push(result);
  }

  return macdResults;
}

// const smaResults = testSMA();
// 获取SMA结果
// console.log("SMA(7)结果长度:", smaResults.length);
// console.log("最后5个SMA(7)结果:", smaResults.slice(-5));

// 测试MACD
const macdResults = testMACD();
console.log("\nMACD结果长度:", macdResults.length);
console.log("最后一个MACD结果:", macdResults.at(-1));
