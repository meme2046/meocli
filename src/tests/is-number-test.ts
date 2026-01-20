import lodash from "lodash";
const { isNaN, isNumber } = lodash;

console.log(isNumber("123"));
console.log(isNumber(null));
console.log(isNumber(1));
console.log(Number(""));
console.log(isNaN(Number("a")));
console.log(Number("123"));
