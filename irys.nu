const PROJECT_NAME = "meocli"
const DIR_PATH = "d:/AudioBooks/opus/大奉打更人_头陀渊"
const DEFAULT_EXTS = ["mp3" "m4a" "opus" "jpg" "jpeg" "png" "txt" "pdf" "json" "html"]

def main [] {
  print 'irys script'
}
# 上传目录（每个文件独立 transaction，不生成 manifest）
# Example:
#   irys ud                                   # 用默认目录和扩展名
#   irys ud --dp ./images --env-file d:/irys.env --token POL
#   irys ud --dp ./dist --token ethereum --tags "app=myapp"
#   irys ud --dp ./audio --skip 10 --take 20 --threads 4
def "main ud" [
  dp: string = $DIR_PATH
  --env-file: string = "d:/irys.env"
  --token: string = "pol"
  --network: string = "mainnet"
  --rpc-url: string = ""
  --tags: string = ""
  --threads: int = 3
  --skip: int = 0
  --take: int = 3
  --exts: string = "" # 逗号分隔扩展名，覆盖默认
  --output-file: string = "./tmp/irys_output.txt" # 输出 JSON 文件路径
] {

  let exts = if $exts == "" { $DEFAULT_EXTS } else { ($exts | split column "," | where {|r| $r != "" }) }
  let exts_comma = $exts | str join ","

  let files = glob $"($dp)/**/*.{($exts_comma)}" | sort --natural

  if ($files | length) == 0 {
    print $"✗ 未找到任何 ($exts_comma) 文件 in ($dp)"
    return
  }

  let files = if $take == 0 { $files | skip $skip } else { $files | skip $skip | take $take }
  let total = ($files | length)

  print $"目录: ($dp)"
  print $"扩展名: ($exts_comma)"
  print $"文件总数: ($total), skip=($skip), take=($take)"
  print $"代币: ($token), 网络: ($network), 并发: ($threads)"
  let results = $files | enumerate | par-each --threads $threads --keep-order {|entry|
      let idx = $entry.index + 1
      let file = ($entry.item | str replace --all "\\" "/")

      # 拼命令参数
      let base = ["pnpm" "dev" "irys" "upload" $file]
      let cmd_list = (if $env_file != "" { ($base | append "--env" | append $env_file) } else { $base })
      let cmd_list = (if $rpc_url != "" { ($cmd_list | append "--rpc-url" | append $rpc_url) } else { $cmd_list })
      let cmd_list = (if $tags != "" { ($cmd_list | append "--tags" | append $tags) } else { $cmd_list })
      let cmd_list = ($cmd_list | append "--token" | append $token | append "--network" | append $network)

      let command = $cmd_list | str join " "
      print $"(ansi ly)($idx)/($total). command:(ansi rst) (ansi gu)($command)(ansi rst)"

      # 执行命令拿 stdout/stderr/exit_code
      let try_res = (
        try {
          let c = (do { ^$cmd_list } | complete)
          {
            ok: true
            stdout: $c.stdout
            stderr: $c.stderr
            exit_code: $c.exit_code
          }
        } catch {
          {
            ok: false
            stdout: ""
            stderr: ($in | describe)
            exit_code: 1
          }
        }
      )

      let output = $try_res.stdout + $try_res.stderr
      let success = $try_res.ok and $try_res.exit_code == 0

      print $'(ansi lm)upload: ($file | path basename), exit_code=($try_res.exit_code)(ansi rst)'

      let tx_id = (
        if $success and ($output | str contains "✓") {
          $output | lines | where {|l| ($l | str trim) | str starts-with "ID:" } | str trim | str replace "ID:" "" | str trim
        } else { "" }
      )
      let url = (
        if $success and ($output | str contains "✓") {
          $output | lines | where {|l| ($l | str trim) | str starts-with "URL:" } | str trim | str replace "URL:" "" | str trim
        } else { "" }
      )

      {
        idx: $idx
        file: $file
        success: $success
        tx_id: $tx_id
        url: $url
        exit_code: $try_res.exit_code
        command: $command
        error: (if $success { "" } else { $output })
      }
    }

  let ok_len = ($results | where {|r| $r.success } | length)
  let fail_len = ($results | where {|r| not $r.success } | length)

  print $"\n(ansi lc)(0..29 | each { "-" } | str join)Upload done(0..29 | each { "-" } | str join)(ansi rst)"

  if $ok_len > 0 {
    print $"(ansi lg)↓ success count: ($ok_len)/($total)(ansi rst)"
    $results | where {|r| $r.success } | each {|r|
      let name = ($r.file | path basename)
      print $"($r.idx). (ansi lc)($name)(ansi rst) → (ansi g)($r.tx_id)(ansi rst)"
    }
  }

  if $fail_len > 0 {
    print $"(ansi lr)↓ fail count: ($fail_len)(ansi rst)"
    $results | where {|r| not $r.success } | each {|r|
      let name = ($r.file | path basename)
      print $"($r.idx). (ansi lc)($name)(ansi rst) → (ansi r)($r.error)(ansi rst)"
    }
  }

  if $output_file != "" {
    $results | save --append $output_file
    print $"\n(ansi y)END. 结果已写入:(ansi rst) (ansi bu)($output_file)(ansi rst)"
  }

  $results | select idx file success tx_id url exit_code error | table
}
