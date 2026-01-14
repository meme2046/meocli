import {Args, Command, Flags} from '@oclif/core'
import {execa} from 'execa'
// import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join} from 'node:path'
import {cwd} from 'node:process'

import {DEFAULT_ARGS, DEFAULT_PLUGINS} from '../../consts/prettierrc.js'

const require = createRequire(import.meta.url)

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
      default: 'built_in',
      description: 'built_in:使用内置规则(默认值), 传入路径则是使用自定义配置, auto:自动检测config file',
      required: false,
    }),
    ignore: Flags.string({
      default: 'built_in',
      description: 'built_in:使用内置规则(默认值), 传入路径则是使用自定义规则, auto:自动检测ignore file',
      required: false,
    }),
    // 'no-config': Flags.boolean({
    //   default: false,
    //   description: 'Disable config file detection',
    // }),
    // 'no-ignore': Flags.boolean({
    //   default: false,
    //   description: 'Disable ignore file detection',
    // }),
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

    const prettierMain = require.resolve('prettier')
    const prettierBin = join(dirname(prettierMain), './bin/prettier.cjs')

    // 获取 prettier 可执行文件的路径
    // const __filename = fileURLToPath(import.meta.url)
    // const __dirname = dirname(__filename)
    // const projectRoot = join(__dirname, '../../../') // 回到项目根目录

    // let prettierBin = join(projectRoot, 'node_modules', '.bin', 'prettier')

    // if (platform() === 'win32') {
    //   prettierBin += '.cmd'
    // }

    if (!existsSync(prettierBin)) {
      this.error(`prettier not found`)
      return
    }

    // 根据包管理器类型构建参数
    let prettierArgs = ['--write', filePath]

    if (ignore === 'built_in') {
      const projectRoot = cwd()
      prettierArgs.unshift('--ignore-path', join(projectRoot, '.prettierignore'))
    } else if (existsSync(ignore)) {
      prettierArgs.unshift('--ignore-path', ignore)
    } else {
      const projectIgnore = this.findProjectPrettierIgnore()
      if (projectIgnore) {
        prettierArgs.unshift('--ignore-path', projectIgnore)
      }
    }

    // const resolvedPluginArgs = this.resolvePluginPaths(DEFAULT_PLUGINS, projectRoot)
    // const argsWithResolvedPlugins = this.replacePluginArgs(DEFAULT_ARGS, resolvedPluginArgs)
    const pluginArgs = this.resolvePluginArgs(DEFAULT_PLUGINS)
    const completeArgs = [...DEFAULT_ARGS, ...pluginArgs, ...prettierArgs]

    if (config === 'built_in') {
      // 为插件参数使用绝对路径，避免全局安装时找不到插件
      prettierArgs = completeArgs
    } else if (existsSync(config)) {
      prettierArgs.unshift('--config', config)
    } else {
      // 否则尝试查找项目中的配置文件
      const projectConfig = this.findProjectPrettierConfig()
      if (projectConfig) {
        prettierArgs.unshift('--config', projectConfig)
      } else {
        // 为插件参数使用绝对路径，避免全局安装时找不到插件
        prettierArgs = completeArgs
      }
    }

    this.debug(prettierBin)
    this.debug(JSON.stringify(prettierArgs))
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

  // 替换默认参数中的插件路径
  private replacePluginArgs(defaultArgs: string[], resolvedPluginPaths: string[]): string[] {
    const newArgs = []
    for (let i = 0; i < defaultArgs.length; i++) {
      if (defaultArgs[i] === '--plugin' && i + 1 < defaultArgs.length) {
        // 跳过这个 '--plugin' 标记和它的值，稍后替换
        i++ // 跳过下一个值（插件名称）
        continue
      }

      newArgs.push(defaultArgs[i])
    }

    // 添加解析后的插件路径
    for (const pluginPath of resolvedPluginPaths) {
      newArgs.push('--plugin', pluginPath)
    }

    return newArgs
  }

  private resolvePluginArgs(plugins: {main: string; name: string}[]): string[] {
    const pluginArgs = []

    for (const plugin of plugins) {
      const pluginPath = require.resolve(plugin.name)
      if (existsSync(pluginPath)) {
        pluginArgs.push('--plugin', pluginPath)
      } else {
        pluginArgs.push('--plugin', plugin.name)
      }
    }

    return pluginArgs
  }

  // 将插件名称转换为绝对路径
  private resolvePluginPaths(plugins: {main: string; name: string}[], projectRoot: string): string[] {
    return plugins.map((plugin) => {
      // 查找插件的实际路径
      const pluginPath = join(projectRoot, 'node_modules', plugin.name, plugin.main)
      if (existsSync(pluginPath)) {
        return pluginPath
      }

      // 如果插件路径不存在，则返回原始名称（让 prettier 自己处理）
      return plugin.name
    })
  }
}
