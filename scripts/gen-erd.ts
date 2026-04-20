import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SQLiteTable, getTableConfig } from "drizzle-orm/sqlite-core";
import * as schema from "../src/lib/db/schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "../docs/er.md");

const tables = Object.values(schema).filter((v): v is SQLiteTable => v instanceof SQLiteTable);

const lines: string[] = ["erDiagram"];

for (const table of tables) {
  const cfg = getTableConfig(table);

  const pkCols = new Set<string>();
  for (const pk of cfg.primaryKeys) for (const c of pk.columns) pkCols.add(c.name);
  for (const col of cfg.columns) if (col.primary) pkCols.add(col.name);

  const fkCols = new Set<string>();
  for (const fk of cfg.foreignKeys) {
    for (const c of fk.reference().columns) fkCols.add(c.name);
  }

  lines.push(`  ${cfg.name} {`);
  for (const col of cfg.columns) {
    const keys = [
      pkCols.has(col.name) ? "PK" : undefined,
      fkCols.has(col.name) ? "FK" : undefined,
      col.isUnique ? "UK" : undefined,
    ].filter((key) => key !== undefined);
    const mark = keys.length > 0 ? ` ${keys.join(",")}` : "";
    const type = col.getSQLType().replace(/\s+/g, "_");
    const nullable = col.notNull ? "" : ' "nullable"';
    lines.push(`    ${type} ${col.name}${mark}${nullable}`);
  }
  lines.push("  }");
}

for (const table of tables) {
  const cfg = getTableConfig(table);
  for (const fk of cfg.foreignKeys) {
    const ref = fk.reference();
    const parent = getTableConfig(ref.foreignColumns[0].table as SQLiteTable).name;
    const label = ref.columns.map((c) => c.name).join(",");
    lines.push(`  ${parent} ||--o{ ${cfg.name} : "${label}"`);
  }
}

const content = `# ER Diagram

Auto-generated from \`src/lib/db/schema.ts\` via \`scripts/gen-erd.ts\`.
Run \`npm run db:erd\` to regenerate. Do not edit by hand.

\`\`\`mermaid
${lines.join("\n")}
\`\`\`
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, content);
console.log(`Wrote ${outPath}`);
