import {Args, Command, Flags} from '@oclif/core'
import {spawn} from 'node:child_process'
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
    ignore: Flags.string({
      char: 'i',
      // default: './src/files/.prettierignore',
      description: 'Prettier ignore file path',
      required: false,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Prettier)

    const {filePath} = args
    const {config, ignore} = flags

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

    this.log(prettierBin)

    if (!existsSync(prettierBin)) {
      this.error(`prettier not found`)
      return
    }

    // 根据包管理器类型构建参数
    let prettierArgs = ['--write', filePath]

    if (config && existsSync(config)) {
      prettierArgs.push(`--config=${config}`)
    } else {
      // 否则尝试查找项目中的配置文件
      const projectConfig = this.findProjectPrettierConfig()

      if (projectConfig) {
        prettierArgs.push(`--config=${projectConfig}`)
      } else {
        prettierArgs = [...prettierArgs, ...DEFAULT_ARGS]
      }
    }

    if (ignore && existsSync(ignore)) {
      prettierArgs.push(`--ignore-path=${ignore}`)
    } else {
      const projectIgnore = this.findProjectPrettierIgnore()
      if (projectIgnore) {
        prettierArgs.push(`--ignore-path=${projectIgnore}`)
      } else {
        // 如果没有找到项目 ignore 文件，跳过此参数
        // Prettier 会使用默认的忽略规则
      }
    }

    this.log(JSON.stringify(prettierArgs))
    // this.log(`Formatting file: ${filePath}`)

    // 返回一个 Promise 以等待子进程完成
    await new Promise((resolve, reject) => {
      const prettierProcess = spawn(prettierBin, prettierArgs, {
        env: {...process.env}, // 确保子进程继承当前环境变量
        shell: false, // 设置为 false 以避免安全警告
        stdio: 'inherit',
        // stdio: 'pipe', // 更改为 pipe 以便捕获输出
      })

      prettierProcess.on('close', (code) => {
        if (code === 0) {
          this.log(`Successfully formatted ${filePath}`)
          resolve(null)
        } else {
          reject(new Error(`Prettier exited with code ${code}`))
        }
      })

      prettierProcess.on('error', (error) => {
        reject(error)
      })
    }).catch((error) => {
      this.error(`Error executing prettier: ${error.message}`)
    })
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
    const possibleConfigs = [
      './.prettierrc',
      './.prettierrc.json',
      './.prettierrc.yaml',
      './.prettierrc.yml',
      './.prettierrc.js',
    ]

    for (const configFile of possibleConfigs) {
      if (existsSync(configFile)) {
        return configFile
      }
    }

    return null
  }

  private findProjectPrettierIgnore(): null | string {
    const possibleIgnoreFiles = [
      './.prettierignore',
      // './.gitignore'
    ]

    for (const ignoreFile of possibleIgnoreFiles) {
      if (existsSync(ignoreFile)) {
        return ignoreFile
      }
    }

    return null
  }
}
