import {Args, Command, Flags} from '@oclif/core'
import {execa} from 'execa'
// import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {platform} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {DEFAULT_ARGS} from '../../consts/prettierrc.js'

export default class Prettier extends Command {
  static args = {
    filePath: Args.string({
      description: 'file path that need to be formatted by Prettier',
      required: true,
    }),
  }
  static description = 'Use Prettier to format file'
  static examples = [
    '<%= config.bin %> <%= command.id %> ./tests/test.json',
    '<%= config.bin %> <%= command.id %> ./src/file.ts --config ./.prettierrc.yaml',
  ]
  static flags = {
    config: Flags.string({
      char: 'c',
      // default: './src/files/.prettierrc.yaml',
      description: 'Prettier config file path',
      required: false,
    }),
    'ignore-path': Flags.string({
      description: 'Prettier ignore file path',
      required: false,
    }),
    'no-config': Flags.boolean({
      default: false,
      description: 'Disable config file detection',
    }),
    'no-ignore': Flags.boolean({
      default: false,
      description: 'Disable ignore file detection',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Prettier)

    const {filePath} = args
    const {config, 'ignore-path': ignorePath, 'no-config': noConfig, 'no-ignore': noIgnore} = flags

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      this.error(`file『${filePath}』not found`)
      return
    }

    // 检测当前使用的包管理器
    // const packageManager = this.detectPackageManager()

    // 获取 prettier 可执行文件的路径
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const projectRoot = join(__dirname, '../../../') // 回到项目根目录

    // let prettierBin = join(projectRoot, 'node_modules', 'prettier', 'node_modules', '.bin', 'prettier')
    let prettierBin = join(projectRoot, 'node_modules', '.bin', 'prettier')

    if (platform() === 'win32') {
      prettierBin += '.cmd'
    }

    // this.log(prettierBin)

    if (!existsSync(prettierBin)) {
      this.error(`prettier not found`)
      return
    }

    // 根据包管理器类型构建参数
    let prettierArgs = ['--write', filePath]

    if (noIgnore) {
      prettierArgs.unshift('--ignore-path', '')
    } else if (ignorePath && existsSync(ignorePath)) {
      prettierArgs.unshift('--ignore-path', ignorePath)
    } else {
      const projectIgnore = this.findProjectPrettierIgnore()
      if (projectIgnore) {
        prettierArgs.unshift('--ignore-path', projectIgnore)
      }
    }

    if (noConfig) {
      prettierArgs = [...DEFAULT_ARGS, ...prettierArgs]
    } else if (config && existsSync(config)) {
      prettierArgs.unshift('--config', config)
    } else {
      // 否则尝试查找项目中的配置文件
      const projectConfig = this.findProjectPrettierConfig()
      if (projectConfig) {
        prettierArgs.unshift('--config', projectConfig)
      } else {
        prettierArgs = [...DEFAULT_ARGS, ...prettierArgs]
      }
    }

    // this.log(JSON.stringify(prettierArgs))
    // this.log(`Formatting file: ${filePath}`)

    const {stderr, stdout} = await execa(prettierBin, prettierArgs, {
      env: {...process.env},
    })

    if (stdout) {
      this.log(stdout)
    }

    if (stderr) {
      this.warn(stderr)
    }

    this.log(`Successfully formatted ${filePath}`)
  }

  private detectPackageManager(): string {
    // 检查项目根目录是否存在 pnpm-lock.yaml 来判断是否使用 pnpm
    if (existsSync(join(process.cwd(), 'pnpm-lock.yaml'))) {
      return 'pnpx'
    }

    // 检查是否存在 yarn.lock 来判断是否使用 yarn
    if (existsSync(join(process.cwd(), 'yarn.lock'))) {
      return 'yarn'
    }

    // 默认使用 npm
    return 'npx'
  }

  private findProjectPrettierConfig(): null | string {
    const possibleConfigs = ['.prettierrc', '.prettierrc.json', '.prettierrc.yaml', '.prettierrc.yml', '.prettierrc.js']

    for (const configFile of possibleConfigs) {
      if (existsSync(configFile)) {
        return configFile
      }
    }

    return null
  }

  private findProjectPrettierIgnore(): null | string {
    const possibleIgnoreFiles = ['.prettierignore', '.gitignore']

    for (const ignoreFile of possibleIgnoreFiles) {
      if (existsSync(ignoreFile)) {
        return ignoreFile
      }
    }

    return null
  }
}
