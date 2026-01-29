import lodash from "lodash";
const { flatMap, isNaN, isNumber, round } = lodash;

console.log(isNumber("123"));
console.log(isNumber(null));
console.log(isNumber(1));
console.log(Number(""));
console.log(isNaN(Number("a")));
console.log(Number("123"));

// 测试用例1：正常情况
const A = { a: "1", b: "2", c: "3" };
const B = { a: "11", b: "22", d: "44" };

// 只保留A中存在的键，且B中值不为undefined或空字符串
const pickedB = lodash.pick(B, Object.keys(A));
const filteredB = lodash.pickBy(
  pickedB,
  (value) => value !== undefined && value !== "",
);
const result = { ...A, ...filteredB };

console.log(result); // 输出：{ a: '11', b: '22', c: '3' }

// 测试用例2：包含undefined和空字符串
const A2 = { a: "1", b: "2", c: "3" };
const B2 = { a: undefined, b: "", c: "33", d: "44" };

const pickedB2 = lodash.pick(B2, Object.keys(A2));
const filteredB2 = lodash.pickBy(
  pickedB2,
  (value) => value !== undefined && value !== "",
);
const result2 = { ...A2, ...filteredB2 };

console.log(result2); // 输出：{ a: '1', b: '2', c: '33' }
console.log(round(123, -1));
console.log(flatMap([1, 2, 3], (num) => [num, num * 2]));
