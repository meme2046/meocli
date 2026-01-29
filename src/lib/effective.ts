export const effective = (src: string): string =>
  src.replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1");

// src.replace(/(\.\d*[1-9])0+$/, "$1").replace(/\.0+$/, "")
