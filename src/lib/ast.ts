import { generate } from "@babel/generator";
import { parse } from "@babel/parser";
import * as t from "@babel/types";
import fs from "node:fs/promises";

/** 创建字面量节点 */
function createLiteralNode(value: unknown): t.Literal {
  if (typeof value === "string") return t.stringLiteral(value);
  if (typeof value === "number") return t.numericLiteral(value);
  if (typeof value === "boolean") return t.booleanLiteral(value);
  return t.stringLiteral(String(value));
}
/** JS对象转babel ObjectExpression AST节点 */
/** JS值转babel AST节点（支持对象和数组） */

export function objToAst(
  value: Record<string, unknown> | unknown[],
): t.Expression {
  // 如果是数组
  if (Array.isArray(value)) {
    const elements: t.Expression[] = value.map((item) => {
      if (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
      ) {
        return createLiteralNode(item);
      }
      // 递归处理嵌套对象/数组

      return objToAst(item as Record<string, unknown> | unknown[]);
    });
    return t.arrayExpression(elements);
  }

  // 如果是对象
  const props: t.ObjectProperty[] = [];
  for (const [k, v] of Object.entries(value)) {
    let valNode: t.Expression;
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      valNode = createLiteralNode(v);
    } else if (Array.isArray(v)) {
      // 递归处理数组
      valNode = objToAst(v);
    } else {
      // 递归处理嵌套对象
      valNode = objToAst(v as Record<string, unknown>);
    }

    props.push(t.objectProperty(t.identifier(k), valNode));
  }

  return t.objectExpression(props);
}

/** 读取JS文件并返回AST */
export async function readJsAst(filePath: string) {
  const source = await fs.readFile(filePath, "utf8");
  return parse(source, {
    sourceType: "script",
  });
}

/** AST 生成并覆盖写入文件 */
export async function writeAst(ast: t.Node, filePath: string) {
  const output = generate(ast, { compact: false, retainLines: true }).code;
  await fs.writeFile(filePath, output, "utf8");
}
