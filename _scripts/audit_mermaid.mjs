#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function auditMermaid(src, file, blockNo) {
  const lines = src.split("\n");
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    // invalid parallelogram: [/...] but not [/.../]
    for (const m of line.matchAll(/\[[^\[\]"']*\]/g)) {
      const label = m[0];
      if (!label.startsWith("[/")) continue;
      if (/^\[[^\]]+\/\]$/.test(label)) continue;
      issues.push({
        kind: "invalid-parallelogram",
        lineNo,
        text: line.trim(),
        label,
        fix: fixLabel(label),
      });
    }

    // unquoted label with leading slash inside brackets: ["/path"] is ok, [/path] caught above
    // stadium/circle with slash: (("/x")) rare

    // reserved word 'end' as bare node (flowchart)
    if (/^\s*end\s*(\[|$|-->|---)/i.test(line) && !/subgraph|end\s*$/i.test(line)) {
      issues.push({ kind: "reserved-end", lineNo, text: line.trim() });
    }
  }

  return issues;
}

function fixLabel(label) {
  const inner = label.slice(1, -1);
  return `["${inner.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
}

function fixMermaidBlock(src) {
  let out = src;
  const issues = auditMermaid(src, "", 0);
  const labels = [...new Set(issues.filter((i) => i.kind === "invalid-parallelogram").map((i) => i.label))];
  labels.sort((a, b) => b.length - a.length);
  for (const label of labels) {
    out = out.split(label).join(fixLabel(label));
  }
  return { out, issues, changed: out !== src };
}

function* walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "_scripts" || ent.name === ".git") continue;
      yield* walk(p);
    } else if (ent.name.endsWith(".md")) yield p;
  }
}

let totalIssues = 0;
let fixedFiles = 0;

for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, "utf8");
  const re = /```mermaid\r?\n([\s\S]*?)```/g;
  let m;
  let newText = text;
  const edits = [];
  let blockNo = 0;

  while ((m = re.exec(text)) !== null) {
    blockNo++;
    const { out, issues, changed } = fixMermaidBlock(m[1]);
    if (issues.length) {
      const rel = path.relative(ROOT, file);
      for (const issue of issues) {
        totalIssues++;
        console.log(`${rel}:${issue.lineNo} [${issue.kind}] ${issue.text}`);
        if (issue.fix) console.log(`  -> ${issue.fix}`);
      }
    }
    if (changed) {
      edits.push({
        start: m.index,
        end: m.index + m[0].length,
        replacement: "```mermaid\n" + out + "```",
      });
    }
  }

  if (edits.length) {
    for (const e of edits.sort((a, b) => b.start - a.start)) {
      newText = newText.slice(0, e.start) + e.replacement + newText.slice(e.end);
    }
    fs.writeFileSync(file, newText, "utf8");
    fixedFiles++;
  }
}

console.log(`\nAudit done. ${totalIssues} issue(s), ${fixedFiles} file(s) updated.`);
