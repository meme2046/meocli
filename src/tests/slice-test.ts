import lodash from "lodash";
const { isNaN, slice } = lodash;

const list = [1, 2, 3, 55, 6];

console.log(slice(list, -2));
const a: number[] = [1, 2, 3, 4, 5];

// 访问不存在的索引 8，不会异常，返回 undefined
const result = a[8];
console.log(result); // 输出：undefined
console.log(typeof result); // 输出：undefined
console.log(isNaN(0)); // 输出：false

console.log(
  [
    "#4DAF4A",
    "#E41A1C",
    "#00C9C9",
    "#7863FF",
    "#1783FF",
    "#F0884D",
    "#D580FF",
    "#57534D",
    "#8200DB",
    "#78716B",
  ].slice(0, 3),
);
