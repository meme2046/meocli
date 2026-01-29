import lodash from "lodash";
const { toNumber } = lodash;

const a = "89425.38000000";
const b = "89431.81002100";

console.log(Number(a));
console.log(Number(b));
console.log(toNumber(a));
console.log(toNumber(b));
