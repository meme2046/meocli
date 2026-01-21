import lodash from "lodash";
const { pick, pickBy } = lodash;

function mergeNonEmpty<T extends object>(b: object, a: T) {
  const pickedB = pick(b, Object.keys(a));

  const filteredB = pickBy(pickedB, (v) => v);
  // 会被排除的值(假值)：
  // - undefined
  // - null
  // - "" (空字符串)
  // - false
  // - 0
  // - NaN
  // - 0n (BigInt 零)

  // 不会被排除的值（真值）：
  // - -1 (非零数字都是真值)
  // - 非空字符串
  // - 非空对象
  // - 非空数组
  // - true

  return { ...a, ...filteredB };
}

console.log(
  mergeNonEmpty(
    { a: 123, price: 1234 },
    { a: 3, b: 4, e: undefined, price: 0 },
  ),
);
console.log(Object.keys({ a: 3, b: 4, e: undefined, price: 0 }));
