export type SyntaxToken = "plain" | "keyword" | "string" | "comment" | "number" | "function" | "type" | "operator" | "property";

const KEYWORDS = new Set([
  "abstract", "and", "as", "async", "await", "break", "case", "catch", "class", "const", "continue", "def", "default", "delete", "do", "else", "enum", "export", "extends", "false", "final", "finally", "fn", "for", "from", "func", "function", "if", "implements", "import", "in", "interface", "is", "let", "match", "namespace", "new", "nil", "none", "null", "of", "or", "package", "private", "protected", "public", "readonly", "return", "self", "static", "struct", "super", "switch", "this", "throw", "trait", "true", "try", "type", "typeof", "undefined", "use", "var", "void", "when", "where", "while", "with", "yield",
]);

const TYPES = new Set([
  "any", "bool", "boolean", "byte", "char", "double", "dynamic", "float", "int", "integer", "long", "never", "number", "object", "short", "string", "symbol", "unknown", "usize", "vec",
]);

const OPERATORS = new Set("=+-*/%<>!&|?:~^".split(""));

function mark(tokens: SyntaxToken[], start: number, end: number, token: SyntaxToken) {
  for (let index = start; index < end; index += 1) tokens[index] = token;
}

export function tokenizeCode(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = Array.from({ length: code.length }, () => "plain");
  let index = 0;

  while (index < code.length) {
    const char = code[index];
    const next = code[index + 1];

    if (char === "/" && next === "/" || char === "#") {
      const end = code.indexOf("\n", index);
      mark(tokens, index, end === -1 ? code.length : end, "comment");
      index = end === -1 ? code.length : end;
      continue;
    }
    if (char === "/" && next === "*") {
      const close = code.indexOf("*/", index + 2);
      const end = close === -1 ? code.length : close + 2;
      mark(tokens, index, end, "comment");
      index = end;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      const quote = char;
      let end = index + 1;
      while (end < code.length) {
        if (code[end] === "\\") end += 2;
        else if (code[end] === quote) { end += 1; break; }
        else end += 1;
      }
      mark(tokens, index, end, "string");
      index = end;
      continue;
    }
    if (/\d/.test(char) && !/[\w$]/.test(code[index - 1] ?? "")) {
      const match = code.slice(index).match(/^(?:0x[\da-f]+|\d+(?:\.\d+)?)/i)?.[0] ?? char;
      mark(tokens, index, index + match.length, "number");
      index += match.length;
      continue;
    }
    if (/[A-Za-z_$]/.test(char)) {
      const word = code.slice(index).match(/^[A-Za-z_$][\w$]*/)?.[0] ?? char;
      let token: SyntaxToken = "plain";
      if (KEYWORDS.has(word.toLowerCase())) token = "keyword";
      else if (TYPES.has(word.toLowerCase()) || /^[A-Z]/.test(word)) token = "type";
      else {
        const rest = code.slice(index + word.length);
        if (/^\s*\(/.test(rest)) token = "function";
        else if (/^\s*:/.test(rest) || code[index - 1] === ".") token = "property";
      }
      mark(tokens, index, index + word.length, token);
      index += word.length;
      continue;
    }
    if (OPERATORS.has(char)) tokens[index] = "operator";
    index += 1;
  }

  return tokens;
}
