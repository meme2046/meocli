import lodash from "lodash";
const { isEmpty, isNull } = lodash;

console.log(isNull(null));
// => true
console.log(isNull(""));
console.log(isEmpty([1, 2, 3]));
console.log("------");
console.log(isEmpty(""));
console.log(isEmpty(null));
console.log(isEmpty(true));
console.log(isEmpty(1));
