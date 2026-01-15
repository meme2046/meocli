import {dump} from 'js-yaml'
import fs from 'node:fs'
export function toYamlFile(fp: string, data: unknown) {
  const yamlStr = dump(data, {indent: 2})
  fs.writeFileSync(fp, yamlStr, 'utf8')
}
