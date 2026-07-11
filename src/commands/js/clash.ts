import traverse from "@babel/traverse";
import { Statement } from "@babel/types";
import { Args, Command, Flags } from "@oclif/core";
import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";

import { objToAst, readJsAst, writeAst } from "../../lib/ast.js";
import { require } from "../../lib/commonjs.js";
export default class ClashModify extends Command {
  static args = {
    filePath: Args.string({
      description: "目标js文件路径",
      required: true,
    }),
    templatePath: Args.string({
      description: "自定义配置文件路径",
      required: true,
    }),
  };
  static description = "修改Clash脚本";
  static examples = [
    "<%= config.bin %> <%= command.id %> ./tests/test.js ./template.json",
  ];
  static flags = {
    verbose: Flags.boolean({
      char: "v",
      default: false,
      description: "Show verbose output",
    }),
  };

  // https://github.com/IvanSolis1989/Smart-Config-Kit/tree/main/Clash%20Party

  async run() {
    const { args, flags } = await this.parse(ClashModify);
    const { filePath, templatePath } = args;
    const { verbose } = flags;

    if (verbose) {
      process.env.DEBUG = "oclif:me:js";
      require("debug").enable(process.env.DEBUG);
    }

    // 检查目标文件是否存在
    if (!existsSync(filePath)) {
      this.error(`file『${filePath}』not found`);
      return;
    }

    // 检查 template.json 是否存在
    if (!existsSync(templatePath)) {
      this.error(`template file『${templatePath}』not found`);
      return;
    }

    // 读取 template.json 配置
    const templateContent = readFileSync(templatePath, "utf8");
    const template = JSON.parse(templateContent);
    const { ruleProviders, ruleSet, v6Domains } = template;

    this.log("✔ 已读取 template.json 配置:");
    this.log(`  - ruleSet: ${JSON.stringify(ruleSet)}`);
    this.log(
      `  - ruleProviders: ${Object.keys(ruleProviders || {}).join(", ")}`,
    );
    this.log(`  - v6Domains: ${JSON.stringify(v6Domains)}`);
    this.log("");

    // 1. 读取并解析AST
    const ast = await readJsAst(filePath);

    traverse(ast, {
      // 在 main 函数的 return config 前插入自定义代码
      FunctionDeclaration: (path) => {
        if (path.node.id?.name === "main") {
          const statements = path.node.body.body;

          // 找到第一个 return config; 语句（在 try 块末尾）
          for (let i = statements.length - 1; i >= 0; i--) {
            const stmt = statements[i];
            if (
              stmt.type === "ReturnStatement" &&
              stmt.argument?.type === "Identifier" &&
              stmt.argument.name === "config"
            ) {
              // 构建要插入的代码 AST
              const insertStatements: unknown[] = [];

              // 1. config.rules = [...ruleSet, ...config.rules];
              if (ruleSet && Array.isArray(ruleSet)) {
                const ruleSetVar = {
                  declarations: [
                    {
                      id: { name: "ruleSet", type: "Identifier" },
                      init: objToAst(ruleSet),
                      type: "VariableDeclarator",
                    },
                  ],
                  kind: "const",
                  type: "VariableDeclaration",
                };
                insertStatements.push(ruleSetVar);

                const rulesAssign = {
                  expression: {
                    left: {
                      object: { name: "config", type: "Identifier" },
                      property: { name: "rules", type: "Identifier" },
                      type: "MemberExpression",
                    },
                    operator: "=",
                    right: {
                      elements: [
                        {
                          argument: { name: "ruleSet", type: "Identifier" },
                          type: "SpreadElement",
                        },
                        {
                          argument: {
                            object: { name: "config", type: "Identifier" },
                            property: { name: "rules", type: "Identifier" },
                            type: "MemberExpression",
                          },
                          type: "SpreadElement",
                        },
                      ],
                      type: "ArrayExpression",
                    },
                    type: "AssignmentExpression",
                  },
                  type: "ExpressionStatement",
                };
                insertStatements.push(rulesAssign);
                this.log("✔ 已添加 ruleSet 到 config.rules 开头");
              }

              // 2. ruleProviders 合并
              if (ruleProviders && typeof ruleProviders === "object") {
                const ruleProvidersVar = {
                  declarations: [
                    {
                      id: { name: "ruleProviders", type: "Identifier" },
                      init: objToAst(ruleProviders),
                      type: "VariableDeclarator",
                    },
                  ],
                  kind: "const",
                  type: "VariableDeclaration",
                };
                insertStatements.push(ruleProvidersVar);

                const ruleProvidersAssign = {
                  expression: {
                    left: {
                      computed: true,
                      object: { name: "config", type: "Identifier" },
                      property: {
                        type: "StringLiteral",
                        value: "rule-providers",
                      },
                      type: "MemberExpression",
                    },
                    operator: "=",
                    right: {
                      properties: [
                        {
                          key: { name: "ruleProviders", type: "Identifier" },
                          shorthand: true,
                          type: "Property",
                          value: { name: "ruleProviders", type: "Identifier" },
                        },
                        {
                          key: {
                            computed: true,
                            object: { name: "config", type: "Identifier" },
                            property: {
                              type: "StringLiteral",
                              value: "rule-providers",
                            },
                            type: "MemberExpression",
                          },
                          shorthand: false,
                          type: "Property",
                          value: {
                            computed: true,
                            object: { name: "config", type: "Identifier" },
                            property: {
                              type: "StringLiteral",
                              value: "rule-providers",
                            },
                            type: "MemberExpression",
                          },
                        },
                      ],
                      type: "ObjectExpression",
                    },
                    type: "AssignmentExpression",
                  },
                  type: "ExpressionStatement",
                };
                insertStatements.push(ruleProvidersAssign);
                this.log(
                  `✔ 已合并 ruleProviders: ${Object.keys(ruleProviders).join(", ")}`,
                );
              }

              // 3. IPv6 相关配置
              if (v6Domains && Array.isArray(v6Domains)) {
                const v6DomainsVar = {
                  declarations: [
                    {
                      id: { name: "v6Domains", type: "Identifier" },
                      init: objToAst(v6Domains),
                      type: "VariableDeclarator",
                    },
                  ],
                  kind: "const",
                  type: "VariableDeclaration",
                };
                insertStatements.push(v6DomainsVar);

                // config.ipv6 = true
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
                insertStatements.push(ipv6Assign1);

                // config.dns.ipv6 = true
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
                insertStatements.push(ipv6Assign2);

                // 定义 domesticDoH（与原脚本一致）
                const domesticDoHDecl = {
                  declarations: [
                    {
                      id: { name: "domesticDoH", type: "Identifier" },
                      init: {
                        elements: [
                          {
                            type: "StringLiteral",
                            value: "https://dns.alidns.com/dns-query",
                          },
                          {
                            type: "StringLiteral",
                            value: "https://doh.pub/dns-query",
                          },
                        ],
                        type: "ArrayExpression",
                      },
                      type: "VariableDeclarator",
                    },
                  ],
                  kind: "var",
                  type: "VariableDeclaration",
                };
                insertStatements.push(domesticDoHDecl);

                // const ipv6Doh = [...]
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
                insertStatements.push(ipv6DohDecl);

                // const mixedDns = [...domesticDoH, ...ipv6Doh]
                const mixedDnsDecl = {
                  declarations: [
                    {
                      id: { name: "mixedDns", type: "Identifier" },
                      init: {
                        elements: [
                          {
                            argument: {
                              name: "domesticDoH",
                              type: "Identifier",
                            },
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
                insertStatements.push(mixedDnsDecl);

                // v6Domains.forEach 设置 nameserver-policy
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
                      object: { name: "v6Domains", type: "Identifier" },
                      property: { name: "forEach", type: "Identifier" },
                      type: "MemberExpression",
                    },
                    type: "CallExpression",
                  },
                  type: "ExpressionStatement",
                };
                insertStatements.push(forEachDnsPolicy);

                // v6Domains.forEach 设置 fake-ip-filter
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
                      object: { name: "v6Domains", type: "Identifier" },
                      property: { name: "forEach", type: "Identifier" },
                      type: "MemberExpression",
                    },
                    type: "CallExpression",
                  },
                  type: "ExpressionStatement",
                };
                insertStatements.push(forEachFakeIpFilter);

                this.log(
                  `✔ 已添加 IPv6 配置，目标域名: ${v6Domains.join(", ")}`,
                );
              }

              // 在 return config 前插入所有语句
              if (insertStatements.length > 0) {
                statements.splice(
                  i,
                  0,
                  ...(insertStatements as unknown as Statement[]),
                );
                this.log("");
              }

              break;
            }
          }
        }
      },
    });

    // 生成新文件名
    const ext = extname(filePath); // 获取扩展名（如 .js）
    const baseName = filePath.slice(0, -ext.length); // 获取去掉扩展名的文件名
    const outputPath = `${baseName}_update${ext}`; // 拼接新文件名

    await writeAst(ast, outputPath); // 保存到新文件
    // 3. 写回文件
    this.log(`✔ 自定义clash配置添加完成, 输出文件: ${outputPath}`);
  }
}
