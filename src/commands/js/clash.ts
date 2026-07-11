import type { Statement } from "@babel/types";

import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { Args, Command, Flags } from "@oclif/core";
import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";

import { objToAst, readJsAst, writeAst } from "../../lib/ast.js";
import { require } from "../../lib/commonjs.js";

export default class ClashModify extends Command {
  static args = {
    filePath: Args.string({ description: "目标js文件路径", required: true }),
    templatePath: Args.string({
      description: "template.json配置文件路径",
      required: true,
    }),
  };
  static description = "修改Clash脚本";
  static examples = [
    "<%= config.bin %> <%= command.id %> ./test.js ./template.json",
  ];
  static flags = {
    verbose: Flags.boolean({
      char: "v",
      default: false,
      description: "Show verbose output",
    }),
  };

  async run() {
    const { args, flags } = await this.parse(ClashModify);
    const { filePath, templatePath } = args;
    const { verbose } = flags;

    if (verbose) {
      process.env.DEBUG = "oclif:me:js";
      require("debug").enable(process.env.DEBUG);
    }

    if (!existsSync(filePath)) {
      this.error(`file『${filePath}』not found`);
      return;
    }

    if (!existsSync(templatePath)) {
      this.error(`template file『${templatePath}』not found`);
      return;
    }

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

    const ast = await readJsAst(filePath);

    traverse(ast, {
      FunctionDeclaration: (path) => {
        if (path.node.id?.name === "main") {
          path.traverse({
            TryStatement: (tryPath) => {
              const tryBody = tryPath.node.block.body;
              for (let i = tryBody.length - 1; i >= 0; i--) {
                const stmt = tryBody[i];
                if (
                  t.isReturnStatement(stmt) &&
                  t.isIdentifier(stmt.argument) &&
                  stmt.argument.name === "config"
                ) {
                  const insertStatements: Statement[] = [];

                  // 1. ruleSet
                  if (ruleSet && Array.isArray(ruleSet)) {
                    const ruleSetVar = t.variableDeclaration("const", [
                      t.variableDeclarator(
                        t.identifier("ruleSet"),
                        objToAst(ruleSet),
                      ),
                    ]);
                    insertStatements.push(ruleSetVar);

                    const rulesAssign = t.expressionStatement(
                      t.assignmentExpression(
                        "=",
                        t.memberExpression(
                          t.identifier("config"),
                          t.identifier("rules"),
                        ),
                        t.arrayExpression([
                          t.spreadElement(t.identifier("ruleSet")),
                          t.spreadElement(
                            t.memberExpression(
                              t.identifier("config"),
                              t.identifier("rules"),
                            ),
                          ),
                        ]),
                      ),
                    );
                    insertStatements.push(rulesAssign);
                    this.log("✔ 已添加 ruleSet 到 config.rules 开头");
                  }

                  // 2. ruleProviders
                  if (ruleProviders && typeof ruleProviders === "object") {
                    const ruleProvidersVar = t.variableDeclaration("const", [
                      t.variableDeclarator(
                        t.identifier("ruleProviders"),
                        objToAst(ruleProviders),
                      ),
                    ]);
                    insertStatements.push(ruleProvidersVar);

                    // 使用 forEach 方式合并 ruleProviders
                    const forEachRuleProviders = t.expressionStatement(
                      t.callExpression(
                        t.memberExpression(
                          t.callExpression(
                            t.memberExpression(
                              t.identifier("Object"),
                              t.identifier("keys"),
                            ),
                            [t.identifier("ruleProviders")],
                          ),
                          t.identifier("forEach"),
                        ),
                        [
                          t.functionExpression(
                            null,
                            [t.identifier("key")],
                            t.blockStatement([
                              t.expressionStatement(
                                t.assignmentExpression(
                                  "=",
                                  t.memberExpression(
                                    t.memberExpression(
                                      t.identifier("config"),
                                      t.stringLiteral("rule-providers"),
                                      true,
                                    ),
                                    t.identifier("key"),
                                    true,
                                  ),
                                  t.memberExpression(
                                    t.identifier("ruleProviders"),
                                    t.identifier("key"),
                                    true,
                                  ),
                                ),
                              ),
                            ]),
                          ),
                        ],
                      ),
                    );
                    insertStatements.push(forEachRuleProviders);
                    this.log(
                      `✔ 已合并 ruleProviders: ${Object.keys(ruleProviders).join(", ")}`,
                    );
                  }

                  // 3. IPv6 配置
                  if (v6Domains && Array.isArray(v6Domains)) {
                    const v6DomainsVar = t.variableDeclaration("const", [
                      t.variableDeclarator(
                        t.identifier("v6Domains"),
                        objToAst(v6Domains),
                      ),
                    ]);
                    insertStatements.push(
                      v6DomainsVar,
                      t.expressionStatement(
                        t.assignmentExpression(
                          "=",
                          t.memberExpression(
                            t.identifier("config"),
                            t.identifier("ipv6"),
                          ),
                          t.booleanLiteral(true),
                        ),
                      ),
                      t.expressionStatement(
                        t.assignmentExpression(
                          "=",
                          t.memberExpression(
                            t.memberExpression(
                              t.identifier("config"),
                              t.identifier("dns"),
                            ),
                            t.identifier("ipv6"),
                          ),
                          t.booleanLiteral(true),
                        ),
                      ),
                    );

                    // domesticDoH
                    const domesticDoHDecl = t.variableDeclaration("const", [
                      t.variableDeclarator(
                        t.identifier("domesticDoH"),
                        t.arrayExpression([
                          t.stringLiteral("https://dns.alidns.com/dns-query"),
                          t.stringLiteral("https://doh.pub/dns-query"),
                        ]),
                      ),
                    ]);
                    insertStatements.push(domesticDoHDecl);

                    // ipv6Doh
                    const ipv6DohDecl = t.variableDeclaration("const", [
                      t.variableDeclarator(
                        t.identifier("ipv6Doh"),
                        t.arrayExpression([
                          t.stringLiteral("https://[2402:4e00::]/dns-query"),
                          t.stringLiteral("https://[2400:3200::1]/dns-query"),
                        ]),
                      ),
                    ]);
                    insertStatements.push(ipv6DohDecl);

                    // mixedDns
                    const mixedDnsDecl = t.variableDeclaration("const", [
                      t.variableDeclarator(
                        t.identifier("mixedDns"),
                        t.arrayExpression([
                          t.spreadElement(t.identifier("domesticDoH")),
                          t.spreadElement(t.identifier("ipv6Doh")),
                        ]),
                      ),
                    ]);
                    insertStatements.push(mixedDnsDecl);

                    // v6Domains.forEach nameserver-policy
                    const forEachDnsPolicy = t.expressionStatement(
                      t.callExpression(
                        t.memberExpression(
                          t.identifier("v6Domains"),
                          t.identifier("forEach"),
                        ),
                        [
                          t.functionExpression(
                            null,
                            [t.identifier("host")],
                            t.blockStatement([
                              t.ifStatement(
                                t.unaryExpression(
                                  "!",
                                  t.memberExpression(
                                    t.memberExpression(
                                      t.memberExpression(
                                        t.identifier("config"),
                                        t.identifier("dns"),
                                      ),
                                      t.stringLiteral("nameserver-policy"),
                                      true,
                                    ),
                                    t.identifier("host"),
                                    true,
                                  ),
                                ),
                                t.blockStatement([
                                  t.expressionStatement(
                                    t.assignmentExpression(
                                      "=",
                                      t.memberExpression(
                                        t.memberExpression(
                                          t.memberExpression(
                                            t.identifier("config"),
                                            t.identifier("dns"),
                                          ),
                                          t.stringLiteral("nameserver-policy"),
                                          true,
                                        ),
                                        t.identifier("host"),
                                        true,
                                      ),
                                      t.callExpression(
                                        t.memberExpression(
                                          t.identifier("mixedDns"),
                                          t.identifier("slice"),
                                        ),
                                        [],
                                      ),
                                    ),
                                  ),
                                ]),
                              ),
                            ]),
                          ),
                        ],
                      ),
                    );
                    insertStatements.push(forEachDnsPolicy);

                    // v6Domains.forEach fake-ip-filter
                    const forEachFakeIpFilter = t.expressionStatement(
                      t.callExpression(
                        t.memberExpression(
                          t.identifier("v6Domains"),
                          t.identifier("forEach"),
                        ),
                        [
                          t.functionExpression(
                            null,
                            [t.identifier("domain")],
                            t.blockStatement([
                              t.ifStatement(
                                t.unaryExpression(
                                  "!",
                                  t.callExpression(
                                    t.memberExpression(
                                      t.memberExpression(
                                        t.memberExpression(
                                          t.identifier("config"),
                                          t.identifier("dns"),
                                        ),
                                        t.stringLiteral("fake-ip-filter"),
                                        true,
                                      ),
                                      t.identifier("includes"),
                                    ),
                                    [t.identifier("domain")],
                                  ),
                                ),
                                t.blockStatement([
                                  t.expressionStatement(
                                    t.callExpression(
                                      t.memberExpression(
                                        t.memberExpression(
                                          t.memberExpression(
                                            t.identifier("config"),
                                            t.identifier("dns"),
                                          ),
                                          t.stringLiteral("fake-ip-filter"),
                                          true,
                                        ),
                                        t.identifier("push"),
                                      ),
                                      [t.identifier("domain")],
                                    ),
                                  ),
                                ]),
                              ),
                            ]),
                          ),
                        ],
                      ),
                    );
                    insertStatements.push(forEachFakeIpFilter);

                    this.log(
                      `✔ 已添加 IPv6 配置，目标域名: ${v6Domains.join(", ")}`,
                    );
                  }

                  if (insertStatements.length > 0) {
                    tryBody.splice(i, 0, ...insertStatements);
                    this.log("");
                  }

                  break;
                }
              }
            },
          });
        }
      },
    });

    const ext = extname(filePath);
    const baseName = filePath.slice(0, -ext.length);
    const outputPath = `${baseName}_update${ext}`;

    await writeAst(ast, outputPath);
    this.log("✔ 自定义clash配置添加完成");
  }
}
