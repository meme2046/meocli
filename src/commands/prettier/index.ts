import {Args, Command, Flags} from '@oclif/core'
import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {join} from 'node:path'

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
      default: './src/files/.prettierrc.yaml',
      description: 'Prettier config file path',
      required: false,
    }),
    ignore: Flags.string({
      char: 'i',
      default: './src/files/.prettierignore',
      description: 'Prettier ignore file path',
      required: false,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Prettier)

    const {filePath} = args
    const {config, ignore} = flags

    // 检测当前使用的包管理器
    const packageManager = this.detectPackageManager()

    // 根据包管理器类型构建参数
    const prettierArgs = [
      'prettier',
      '--write',
      filePath,
      ...(config ? [`--config=${config}`] : []),
      ...(ignore ? [`--ignore-path=${ignore}`] : []),
    ]

    // this.log(`Formatting file: ${filePath}`)

    // 返回一个 Promise 以等待子进程完成
    await new Promise((resolve, reject) => {
      const prettierProcess = spawn(packageManager, prettierArgs, {
        env: {...process.env}, // 确保子进程继承当前环境变量
        shell: false, // 设置为 false 以避免安全警告
        stdio: 'inherit',
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
}
