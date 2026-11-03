type Value = string | number;
type Row = Record<string, Value>;

type Table = { columns: string[]; rows: Row[] };

class SqlError extends Error {}

function splitStatements(source: string) {
  return source
    .split(";")
    .map((part) => part.replace(/--[^\n]*/g, "").trim())
    .filter(Boolean);
}

function tokenize(source: string) {
  const tokens: string[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "'" ) {
      let j = i + 1;
      let text = "";
      while (j < source.length && source[j] !== "'") text += source[j++];
      tokens.push(`'${text}'`);
      i = j + 1;
      continue;
    }
    if (/[A-Za-z0-9_.*]/.test(c)) {
      let j = i + 1;
      while (j < source.length && /[A-Za-z0-9_.*]/.test(source[j])) j++;
      tokens.push(source.slice(i, j));
      i = j;
      continue;
    }
    if (source.startsWith(">=", i) || source.startsWith("<=", i) || source.startsWith("<>", i)) {
      tokens.push(source.slice(i, i + 2));
      i += 2;
      continue;
    }
    tokens.push(c);
    i++;
  }
  return tokens;
}

function literal(token: string): Value {
  if (token.startsWith("'") && token.endsWith("'")) return token.slice(1, -1);
  if (/^-?\d+$/.test(token)) return Number(token);
  throw new SqlError(`Expected a value, found ${token}`);
}

function compare(op: string, left: Value, right: Value) {
  if (op === "=") return left === right;
  if (op === "<>" || op === "!=") return left !== right;
  const a = Number(left);
  const b = Number(right);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  if (op === ">") return a > b;
  if (op === "<") return a < b;
  if (op === ">=") return a >= b;
  if (op === "<=") return a <= b;
  throw new SqlError(`I can't use ${op} in WHERE yet`);
}

function paint(columns: string[], rows: Row[]) {
  const header = columns.join(" | ");
  const body = rows.map((row) => columns.map((column) => String(row[column] ?? "")).join(" | "));
  return [header, ...body].join("\n");
}

export function runSql(code: string): { stdout: string; error?: string } {
  const db = new Map<string, Table>();
  const prints: string[] = [];
  try {
    for (const statement of splitStatements(code)) {
      const tokens = tokenize(statement);
      const head = tokens[0]?.toUpperCase();
      if (head === "CREATE") {
        const name = tokens[2];
        if (!name || tokens[1]?.toUpperCase() !== "TABLE") throw new SqlError("Use CREATE TABLE name (columns)");
        const open = tokens.indexOf("(");
        const close = tokens.lastIndexOf(")");
        const inner = tokens.slice(open + 1, close);
        const columns: string[] = [];
        for (let i = 0; i < inner.length; i++) {
          if (inner[i] === ",") continue;
          columns.push(inner[i]);
          if (inner[i + 1] && inner[i + 1] !== ",") i++;
        }
        db.set(name, { columns, rows: [] });
        continue;
      }
      if (head === "INSERT") {
        const name = tokens[2];
        const table = db.get(name);
        if (!table) throw new SqlError(`No table named ${name}`);
        const open = tokens.indexOf("(");
        const close = tokens.lastIndexOf(")");
        const values = tokens.slice(open + 1, close).filter((token) => token !== ",");
        const row: Row = {};
        table.columns.forEach((column, index) => {
          row[column] = literal(values[index] ?? "''");
        });
        table.rows.push(row);
        continue;
      }
      if (head === "SELECT") {
        const fromAt = tokens.findIndex((token) => token.toUpperCase() === "FROM");
        if (fromAt < 0) throw new SqlError("SELECT needs FROM");
        const tableName = tokens[fromAt + 1];
        const table = db.get(tableName);
        if (!table) throw new SqlError(`No table named ${tableName}`);
        let rows = table.rows.slice();
        const whereAt = tokens.findIndex((token) => token.toUpperCase() === "WHERE");
        const orderAt = tokens.findIndex((token) => token.toUpperCase() === "ORDER");
        const filterEnd = whereAt < 0 ? tokens.length : orderAt < 0 ? tokens.length : orderAt;
        if (whereAt >= 0) {
          const parts = tokens.slice(whereAt + 1, filterEnd);
          const checks: ((row: Row) => boolean)[] = [];
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].toUpperCase() === "AND") continue;
            const column = parts[i];
            const op = parts[i + 1];
            const value = literal(parts[i + 2]);
            checks.push((row) => compare(op, row[column], value));
            i += 2;
          }
          rows = rows.filter((row) => checks.every((check) => check(row)));
        }
        if (orderAt >= 0) {
          const column = tokens[orderAt + 2];
          const desc = tokens[orderAt + 3]?.toUpperCase() === "DESC";
          rows.sort((a, b) => {
            if (a[column] === b[column]) return 0;
            const higher = a[column] > b[column] ? 1 : -1;
            return desc ? -higher : higher;
          });
        }
        const requested = tokens.slice(1, fromAt).filter((token) => token !== ",");
        if (requested.join("").replace(/\s/g, "").toUpperCase() === "COUNT(*)") {
          prints.push(`count\n${rows.length}`);
          continue;
        }
        const columns = requested[0] === "*" ? table.columns : requested;
        prints.push(paint(columns, rows));
        continue;
      }
      throw new SqlError("This lesson runner knows CREATE TABLE, INSERT, and SELECT");
    }
    return { stdout: prints.join("\n") + (prints.length ? "\n" : "") };
  } catch (error) {
    return { stdout: "", error: error instanceof Error ? error.message : "SQL stopped." };
  }
}
