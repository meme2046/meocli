import { createRequire } from "node:module";

const _require: NodeJS.Require = createRequire(import.meta.url);

export { _require as require };
