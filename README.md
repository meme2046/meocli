# meocli

A new CLI generated with oclif

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/meocli.svg)](https://npmjs.org/package/meocli)
[![Downloads/week](https://img.shields.io/npm/dw/meocli.svg)](https://npmjs.org/package/meocli)

<!-- toc -->

- [meocli](#meocli)
- [Dev](#dev)
- [安装使用](#安装使用)
- [Publish](#publish)
- [Vscode](#vscode)
- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

# Dev

```sh-session
<!-- pnpm exec -->
$ pnpm ncu # 检查更新
$ pnpm ncu -u # 升级更新
<!-- demo -->
$ pnpm run dev hello world
$ pnpm run prod hello world
$ pnpm run dev hello foo -f bar
<!-- prettier -->
$ pnpm run dev prettier ./tmp/test.svg --verbose
$ pnpm run dev prettier ./tmp/test.json --config=auto --ignore=auto
$ pnpm run dev prettier ./tmp/test.svg --config=built_in --ignore=auto
```

# Prettier

```sh-session
$ pnpm install -g meocli
$ me prettier --help
# me prettier reset --verbose # 重置Prettier配置
$ me prettier ./test.svg --verbose # 使用prettier格式化文件
```

# Prettier.Vscode

1. `pnpm install -g meocli`

2. 配合vscode插件:[emeraldwalk.RunOnSave](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave) 保存时自动格式化
3. 配置 `.vscode/settings.json` 添加 `"emeraldwalk.runonsave"` 节点,以下为参考配置⤵︎

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        // prettier
        "match": "\\.(ts|js|json|html|css|graphql|gql|yaml|yml|md)$",
        "notMatch": "node_modules/*$",
        "isAsync": true,
        "cmd": "me prettier ${file}"
      },
      {
        // @prettier/plugin-xml
        "match": "\\.(xml|svg)$",
        "isAsync": true,
        "cmd": "me prettier ${file}"
      },
      {
        // prettier-plugin-toml
        "match": "\\.(toml)$",
        "isAsync": true,
        "cmd": "me prettier ${file}"
      },
      {
        // prettier-plugin-nginx
        "match": "\\.(nginx)$",
        "isAsync": true,
        "cmd": "me prettier ${file}"
      },
      {
        // prettier-plugin-sh
        "match": "\\.(sh|env|Dockerfile|properties|gitignore|dockerignore|prettierignore)$",
        "notMatch": "\\.(nu)$",
        "isAsync": true,
        "cmd": "me prettier ${file}"
      },
      {
        // no-dot-ext
        "match": "Dockerfile$",
        "isAsync": true,
        "cmd": "me prettier ${file}"
      }
    ]
  }
}
```

# Publish

```sh-session
$ pnpm login
$ pnpm build
$ pnpm publish
```

# Usage

<!-- usage -->

```sh-session
$ npm install -g meocli
$ me COMMAND
running command...
$ me (--version)
meocli/0.1.1 win32-x64 node-v24.12.0
$ me --help [COMMAND]
USAGE
  $ me COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`me hello PERSON`](#me-hello-person)
- [`me hello world`](#me-hello-world)
- [`me help [COMMAND]`](#me-help-command)
- [`me plugins`](#me-plugins)
- [`me plugins add PLUGIN`](#me-plugins-add-plugin)
- [`me plugins:inspect PLUGIN...`](#me-pluginsinspect-plugin)
- [`me plugins install PLUGIN`](#me-plugins-install-plugin)
- [`me plugins link PATH`](#me-plugins-link-path)
- [`me plugins remove [PLUGIN]`](#me-plugins-remove-plugin)
- [`me plugins reset`](#me-plugins-reset)
- [`me plugins uninstall [PLUGIN]`](#me-plugins-uninstall-plugin)
- [`me plugins unlink [PLUGIN]`](#me-plugins-unlink-plugin)
- [`me plugins update`](#me-plugins-update)
- [`me prettier FILEPATH`](#me-prettier-filepath)

## `me hello PERSON`

Say hello

```
USAGE
  $ me hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ me hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/meme2046/meocli/blob/v0.1.1/src/commands/hello/index.ts)_

## `me hello world`

Say hello world

```
USAGE
  $ me hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ me hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/meme2046/meocli/blob/v0.1.1/src/commands/hello/world.ts)_

## `me help [COMMAND]`

Display help for me.

```
USAGE
  $ me help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for me.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.36/src/commands/help.ts)_

## `me plugins`

List installed plugins.

```
USAGE
  $ me plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ me plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/index.ts)_

## `me plugins add PLUGIN`

Installs a plugin into me.

```
USAGE
  $ me plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into me.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the ME_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the ME_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ me plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ me plugins add myplugin

  Install a plugin from a github url.

    $ me plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ me plugins add someuser/someplugin
```

## `me plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ me plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ me plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/inspect.ts)_

## `me plugins install PLUGIN`

Installs a plugin into me.

```
USAGE
  $ me plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into me.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the ME_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the ME_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ me plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ me plugins install myplugin

  Install a plugin from a github url.

    $ me plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ me plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/install.ts)_

## `me plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ me plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ me plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/link.ts)_

## `me plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ me plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ me plugins unlink
  $ me plugins remove

EXAMPLES
  $ me plugins remove myplugin
```

## `me plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ me plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/reset.ts)_

## `me plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ me plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ me plugins unlink
  $ me plugins remove

EXAMPLES
  $ me plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/uninstall.ts)_

## `me plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ me plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ me plugins unlink
  $ me plugins remove

EXAMPLES
  $ me plugins unlink myplugin
```

## `me plugins update`

Update installed plugins.

```
USAGE
  $ me plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/update.ts)_

## `me prettier FILEPATH`

Use Prettier to format file

```
USAGE
  $ me prettier FILEPATH [-c <value>] [--ignore <value>] [-v]

ARGUMENTS
  FILEPATH  file path that need to be formatted by Prettier

FLAGS
  -c, --config=<value>  [default: built_in] built_in:使用内置规则(默认值), 传入路径则是使用自定义配置,
                        auto:自动检测config file
  -v, --verbose         Show verbose output
      --ignore=<value>  [default: built_in] built_in:使用内置规则(默认值), 传入路径则是使用自定义规则,
                        auto:自动检测ignore file

DESCRIPTION
  Use Prettier to format file

EXAMPLES
  $ me prettier ./tests/test.json

  $ me prettier ./src/file.ts --config ./.prettierrc.yaml
```

_See code: [src/commands/prettier/index.ts](https://github.com/meme2046/meocli/blob/v0.1.1/src/commands/prettier/index.ts)_

<!-- commandsstop -->
