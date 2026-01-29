import * as d3Format from "d3-format";
import lodash from "lodash";

import { effective } from "../lib/effective.js";
const { formatPrefix } = d3Format;
const { replace } = lodash;

function formatNumberWithUnit(num: number, precision = 2) {
  // 获取d3默认的前缀格式化器
  const formatter = formatPrefix(`,.${precision}`, num);
  return effective(replace(formatter(num), "G", "B"));
}

console.log(formatNumberWithUnit(1));
console.log(formatNumberWithUnit(150_123)); // 输出: 150.1k
console.log(formatNumberWithUnit(23_200_000)); // 输出: 23.2M
console.log(formatNumberWithUnit(1_600_000_000)); // 输出: 1.6B
console.log(formatNumberWithUnit(123_456, 2)); // 输出: 123.46k（自定义精度）
