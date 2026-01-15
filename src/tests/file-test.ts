import {existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'

import {DEFAULT_IGNORE_PATTERNS} from '../consts/prettierrc.js'

const ignoreStr = [...DEFAULT_IGNORE_PATTERNS].join('\n')

writeFileSync('tmp/tmp/.prettierignore', ignoreStr, {encoding: 'utf8'})

export function ensureDirectoryExists(filePath: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true})
  }
}
