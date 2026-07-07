import type { Statement } from "@babel/types";

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

    // 目标 rule-providers 配置
    const ruleProviders = {
      "my-direct": {
        behavior: "classical",
        format: "yaml",
        interval: 300,
        path: "./ruleset/my-direct.yaml",
        type: "http",
        url: "https://raw.githubusercontent.com/meme2046/data/main/clash/direct.yaml?_t={{timestamp}}",
      },
      "my-proxy": {
        behavior: "classical",
        format: "yaml",
        interval: 311,
        path: "./ruleset/my-proxy.yaml",
        type: "http",
        url: "https://raw.githubusercontent.com/meme2046/data/main/clash/proxy.yaml?_t={{timestamp}}",
      },
      "my-reject": {
        behavior: "classical",
        format: "yaml",
        interval: 322,
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
      // 修改 injectRuleProviders、injectRules 和 overwriteGeneral 函数
      FunctionDeclaration: (path) => {
        // 修改 injectRuleProviders 函数内的 rule-providers
        if (path.node.id?.name === "injectRuleProviders") {
          // 找到 if (!config["rule-providers"]) config["rule-providers"] = {}; 的位置
          let insertIndex = 0;
          for (let i = 0; i < path.node.body.body.length; i++) {
            const stmt = path.node.body.body[i];
            // 匹配 if 语句
            if (
              stmt.type === "IfStatement" &&
              stmt.test.type === "UnaryExpression" &&
              stmt.test.operator === "!" &&
              stmt.test.argument.type === "MemberExpression" &&
              stmt.test.argument.object.type === "Identifier" &&
              stmt.test.argument.object.name === "config" &&
              stmt.test.argument.property.type === "StringLiteral" &&
              stmt.test.argument.property.value === "rule-providers"
            ) {
              insertIndex = i + 1; // 在 if 语句之后插入
              break;
            }
          }

          // 在找到的位置之后插入新的赋值语句
          for (const [name, cfg] of Object.entries(ruleProviders)) {
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
                right: objToAst(cfg as Record<string, unknown>),
                type: "AssignmentExpression",
              },
              type: "ExpressionStatement",
            };

            // 使用 splice 在指定位置插入
            path.node.body.body.splice(insertIndex, 0, newAssignment as never);
            insertIndex++; // 下一个插入位置后移
            this.log(`✔ rule-provider '${name}' 已添加/更新:`);
            this.log(`${JSON.stringify(cfg, null, 2)}\n`);
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
                this.log("✔ 已删除原有的 myCustomRules\n");
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
          this.log("✔ 已添加 myCustomRules:");
          this.log(`${JSON.stringify(customRules, null, 2)}\n`);

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
                this.log("✔ 已在 config.rules 前面添加 ...myCustomRules\n");
              }
            },
          });
        }

        // 修改 overwriteGeneral 函数
        if (path.node.id?.name === "overwriteGeneral") {
          const targetDomains = ["api.memeniu.xyz", "meme.us.kg"];

          // 1. 声明 targetDomains 变量
          const targetDomainsDecl = {
            declarations: [
              {
                id: { name: "targetDomains", type: "Identifier" },
                init: objToAst(targetDomains),
                type: "VariableDeclarator",
              },
            ],
            kind: "const",
            type: "VariableDeclaration",
          };

          // 2. 设置 config.ipv6 = true
          const ipv6Assign1 = {
            expression: {
              left: {
                object: { name: "config", type: "Identifier" },
                property: { name: "ipv6", type: "Identifier" },
                type: "MemberExpression",
              },
              operator: "=",
              right: { type: "BooleanLiteral", value: true },
              type: "AssignmentExpression",
            },
            type: "ExpressionStatement",
          };

          // 3. 设置 config.dns.ipv6 = true
          const ipv6Assign2 = {
            expression: {
              left: {
                object: {
                  object: { name: "config", type: "Identifier" },
                  property: { name: "dns", type: "Identifier" },
                  type: "MemberExpression",
                },
                property: { name: "ipv6", type: "Identifier" },
                type: "MemberExpression",
              },
              operator: "=",
              right: { type: "BooleanLiteral", value: true },
              type: "AssignmentExpression",
            },
            type: "ExpressionStatement",
          };

          // 4. 声明 ipv6Doh 数组
          const ipv6DohDecl = {
            declarations: [
              {
                id: { name: "ipv6Doh", type: "Identifier" },
                init: {
                  elements: [
                    {
                      type: "StringLiteral",
                      value: "https://[2402:4e00::]/dns-query",
                    },
                    {
                      type: "StringLiteral",
                      value: "https://[2400:3200::1]/dns-query",
                    },
                  ],
                  type: "ArrayExpression",
                },
                type: "VariableDeclarator",
              },
            ],
            kind: "const",
            type: "VariableDeclaration",
          };

          // 5. 声明 mixedDns 数组
          const mixedDnsDecl = {
            declarations: [
              {
                id: { name: "mixedDns", type: "Identifier" },
                init: {
                  elements: [
                    {
                      argument: { name: "domesticDoH", type: "Identifier" },
                      type: "SpreadElement",
                    },
                    {
                      argument: { name: "ipv6Doh", type: "Identifier" },
                      type: "SpreadElement",
                    },
                  ],
                  type: "ArrayExpression",
                },
                type: "VariableDeclarator",
              },
            ],
            kind: "const",
            type: "VariableDeclaration",
          };

          // 6. 循环给每个域名绑定混合DNS池
          const forEachDnsPolicy = {
            expression: {
              arguments: [
                {
                  body: {
                    body: [
                      {
                        consequent: {
                          body: [
                            {
                              expression: {
                                left: {
                                  computed: true,
                                  object: {
                                    computed: true,
                                    object: {
                                      object: {
                                        name: "config",
                                        type: "Identifier",
                                      },
                                      property: {
                                        name: "dns",
                                        type: "Identifier",
                                      },
                                      type: "MemberExpression",
                                    },
                                    property: {
                                      type: "StringLiteral",
                                      value: "nameserver-policy",
                                    },
                                    type: "MemberExpression",
                                  },
                                  property: {
                                    name: "host",
                                    type: "Identifier",
                                  },
                                  type: "MemberExpression",
                                },
                                operator: "=",
                                right: {
                                  arguments: [],
                                  callee: {
                                    object: {
                                      name: "mixedDns",
                                      type: "Identifier",
                                    },
                                    property: {
                                      name: "slice",
                                      type: "Identifier",
                                    },
                                    type: "MemberExpression",
                                  },
                                  type: "CallExpression",
                                },
                                type: "AssignmentExpression",
                              },
                              type: "ExpressionStatement",
                            },
                          ],
                          type: "BlockStatement",
                        },
                        test: {
                          argument: {
                            computed: true,
                            object: {
                              computed: true,
                              object: {
                                object: { name: "config", type: "Identifier" },
                                property: { name: "dns", type: "Identifier" },
                                type: "MemberExpression",
                              },
                              property: {
                                type: "StringLiteral",
                                value: "nameserver-policy",
                              },
                              type: "MemberExpression",
                            },
                            property: { name: "host", type: "Identifier" },
                            type: "MemberExpression",
                          },
                          operator: "!",
                          type: "UnaryExpression",
                        },
                        type: "IfStatement",
                      },
                    ],
                    type: "BlockStatement",
                  },
                  params: [{ name: "host", type: "Identifier" }],
                  type: "FunctionExpression",
                },
              ],
              callee: {
                object: { name: "targetDomains", type: "Identifier" },
                property: { name: "forEach", type: "Identifier" },
                type: "MemberExpression",
              },
              type: "CallExpression",
            },
            type: "ExpressionStatement",
          };

          // 7. 加入fake-ip白名单
          const forEachFakeIpFilter = {
            expression: {
              arguments: [
                {
                  body: {
                    body: [
                      {
                        consequent: {
                          body: [
                            {
                              expression: {
                                arguments: [
                                  { name: "domain", type: "Identifier" },
                                ],
                                callee: {
                                  object: {
                                    computed: true,
                                    object: {
                                      object: {
                                        name: "config",
                                        type: "Identifier",
                                      },
                                      property: {
                                        name: "dns",
                                        type: "Identifier",
                                      },
                                      type: "MemberExpression",
                                    },
                                    property: {
                                      type: "StringLiteral",
                                      value: "fake-ip-filter",
                                    },
                                    type: "MemberExpression",
                                  },
                                  property: {
                                    name: "push",
                                    type: "Identifier",
                                  },
                                  type: "MemberExpression",
                                },
                                type: "CallExpression",
                              },
                              type: "ExpressionStatement",
                            },
                          ],
                          type: "BlockStatement",
                        },
                        test: {
                          argument: {
                            arguments: [{ name: "domain", type: "Identifier" }],
                            callee: {
                              object: {
                                computed: true,
                                object: {
                                  object: {
                                    name: "config",
                                    type: "Identifier",
                                  },
                                  property: { name: "dns", type: "Identifier" },
                                  type: "MemberExpression",
                                },
                                property: {
                                  type: "StringLiteral",
                                  value: "fake-ip-filter",
                                },
                                type: "MemberExpression",
                              },
                              property: {
                                name: "includes",
                                type: "Identifier",
                              },
                              type: "MemberExpression",
                            },
                            type: "CallExpression",
                          },
                          operator: "!",
                          type: "UnaryExpression",
                        },
                        type: "IfStatement",
                      },
                    ],
                    type: "BlockStatement",
                  },
                  params: [{ name: "domain", type: "Identifier" }],
                  type: "FunctionExpression",
                },
              ],
              callee: {
                object: { name: "targetDomains", type: "Identifier" },
                property: { name: "forEach", type: "Identifier" },
                type: "MemberExpression",
              },
              type: "CallExpression",
            },
            type: "ExpressionStatement",
          };

          // 将所有新语句插入到函数末尾
          const newStatements = [
            targetDomainsDecl,
            ipv6Assign1,
            ipv6Assign2,
            ipv6DohDecl,
            mixedDnsDecl,
            forEachDnsPolicy,
            forEachFakeIpFilter,
          ];

          path.node.body.body.push(
            ...(newStatements as unknown as Statement[]),
          );
          this.log("✔ 已在 overwriteGeneral 函数末尾添加 IPv6 配置代码\n");
        }
      },
    });

    // 生成新文件名
    const ext = extname(filePath); // 获取扩展名（如 .js）
    const baseName = filePath.slice(0, -ext.length); // 获取去掉扩展名的文件名
    const outputPath = `${baseName}_update${ext}`; // 拼接新文件名

    await writeAst(ast, outputPath); // 保存到新文件
    // 3. 写回文件
    this.log("✔ 自定义clash配置添加完成");
  }
}
