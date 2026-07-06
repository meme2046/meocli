import traverse from "@babel/traverse";
import { Args, Command, Flags } from "@oclif/core";
import { existsSync } from "node:fs";
import { extname } from "node:path";

import { objToAst, readJsAst, writeAst } from "../../lib/ast.js";
import { require } from "../../lib/commonjs.js";
export default class ClashModify extends Command {
  static args = {
    filePath: Args.string({
      description: "目标js文件路径",
      required: true,
    }),
  };
  static description = "修改Clash脚本";
  static examples = ["<%= config.bin %> <%= command.id %> ./tests/test.js"];
  static flags = {
    verbose: Flags.boolean({
      char: "v",
      default: false,
      description: "Show verbose output",
    }),
  };

  // https://github.com/IvanSolis1989/Smart-Config-Kit/tree/main/Clash%20Party

  async run() {
    // 目标 myCustomRules
    const customRules = [
      "RULE-SET,my-direct,DIRECT",
      "RULE-SET,my-reject,REJECT",
      "RULE-SET,my-proxy,🌍 全球节点",
    ];

    // 要添加的 fake-ip-filter 域名
    const fakeIpFilterDomains = ["api.memeniu.xyz", "meme.us.kg"];

    // 目标 rule-providers 配置
    const ruleProviders = {
      "my-direct": {
        behavior: "classical",
        format: "yaml",
        interval: 3600,
        path: "./ruleset/my-direct.yaml",
        type: "http",
        url: "https://raw.githubusercontent.com/meme2046/data/main/clash/direct.yaml?_t={{timestamp}}",
      },
      "my-proxy": {
        behavior: "classical",
        format: "yaml",
        interval: 3600,
        path: "./ruleset/my-proxy.yaml",
        type: "http",
        url: "https://raw.githubusercontent.com/meme2046/data/main/clash/proxy.yaml?_t={{timestamp}}",
      },
      "my-reject": {
        behavior: "classical",
        format: "yaml",
        interval: 3600,
        path: "./ruleset/my-reject.yaml",
        type: "http",
        url: "https://raw.githubusercontent.com/meme2046/data/main/clash/reject.yaml?_t={{timestamp}}",
      },
    };

    const { args, flags } = await this.parse(ClashModify);
    const { filePath } = args;
    const { verbose } = flags;

    if (verbose) {
      process.env.DEBUG = "oclif:me:js";
      require("debug").enable(process.env.DEBUG);
    }

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      this.error(`file『${filePath}』not found`);
      return;
    }

    // 1. 读取并解析AST
    const ast = await readJsAst(filePath);

    traverse(ast, {
      // 修改 fake-ip-filter 的 concat 数组
      CallExpression: (path) => {
        const { callee } = path.node;
        // 匹配 currentFakeIpFilter.concat([...])
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "currentFakeIpFilter" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "concat" &&
          path.node.arguments.length > 0 &&
          path.node.arguments[0].type === "ArrayExpression"
        ) {
          const arrayExp = path.node.arguments[0];
          // 添加新域名到数组末尾
          for (const domain of fakeIpFilterDomains) {
            arrayExp.elements.push({ type: "StringLiteral", value: domain });
          }

          this.log(
            `✅ 已添加 fake-ip-filter 域名: ${fakeIpFilterDomains.join(", ")}`,
          );
        }
      },
      // 修改 injectRuleProviders 和 injectRules 函数
      FunctionDeclaration: (path) => {
        // 修改 injectRuleProviders 函数内的 rule-providers
        if (path.node.id?.name === "injectRuleProviders") {
          // 直接在函数体末尾添加所有 rule-providers
          for (const [name, config] of Object.entries(ruleProviders)) {
            const newAssignment = {
              expression: {
                left: {
                  computed: true,
                  object: {
                    computed: true,
                    object: { name: "config", type: "Identifier" },
                    property: {
                      type: "StringLiteral",
                      value: "rule-providers",
                    },
                    type: "MemberExpression",
                  },
                  property: { type: "StringLiteral", value: name },
                  type: "MemberExpression",
                },
                operator: "=",
                right: objToAst(config as Record<string, unknown>),
                type: "AssignmentExpression",
              },
              type: "ExpressionStatement",
            };

            path.node.body.body.push(newAssignment as never);
            this.log(`✅ rule-provider '${name}' 已添加/更新`);
            this.log(`${JSON.stringify(config, null, 2)}`);
          }
        }

        // 修改 injectRules 函数
        if (path.node.id?.name === "injectRules") {
          // 第一遍：删除已存在的 myCustomRules 声明
          path.traverse({
            VariableDeclarator: (innerPath) => {
              const { id } = innerPath.node;
              if (id.type === "Identifier" && id.name === "myCustomRules") {
                innerPath.remove();
                this.log("✅ 已删除原有的 myCustomRules");
              }
            },
          });

          // 添加新的 myCustomRules 到函数开头
          const varDecl = {
            declarations: [
              {
                id: { name: "myCustomRules", type: "Identifier" },
                init: objToAst(customRules),
                type: "VariableDeclarator",
              },
            ],
            kind: "const",
            type: "VariableDeclaration",
          };
          path.node.body.body.unshift(varDecl as never);
          this.log("✅ 已添加 myCustomRules");
          this.log(`${JSON.stringify(customRules, null, 2)}`);

          // 在 config.rules 数组前面添加 ...myCustomRules
          path.traverse({
            AssignmentExpression: (innerPath) => {
              const { left } = innerPath.node;
              // 匹配 config.rules = [...] 赋值
              if (
                left.type === "MemberExpression" &&
                left.object.type === "Identifier" &&
                left.object.name === "config" &&
                left.property.type === "Identifier" &&
                left.property.name === "rules" &&
                innerPath.node.right.type === "ArrayExpression"
              ) {
                const arrayExp = innerPath.node.right as {
                  elements: unknown[];
                };
                // 在数组开头插入展开表达式 ...myCustomRules
                arrayExp.elements.unshift({
                  argument: { name: "myCustomRules", type: "Identifier" },
                  type: "SpreadElement",
                });
                this.log("✅ 已在 config.rules 前面添加 ...myCustomRules");
              }
            },
          });
        }
      },
    });

    // 生成新文件名
    const ext = extname(filePath); // 获取扩展名（如 .js）
    const baseName = filePath.slice(0, -ext.length); // 获取去掉扩展名的文件名
    const outputPath = `${baseName}_update${ext}`; // 拼接新文件名

    await writeAst(ast, outputPath); // 保存到新文件
    // 3. 写回文件
    this.log("\n✅ 文件修改完成:");
  }
}
