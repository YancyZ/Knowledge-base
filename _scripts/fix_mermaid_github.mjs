#!/usr/bin/env node
/**
 * Scan all ```mermaid blocks for GitHub-incompatible node label syntax.
 * Main issue: [/path] is parsed as incomplete parallelogram — must quote or use [/path/].
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");

function quoteLabel(label) {
  const inner = label.slice(1, -1);
  return `["${inner.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
}

function analyzeBracketLabel(label) {
  if (label.startsWith('["') || label.startsWith("['")) return null;
  const inner = label.slice(1, -1);

  // parallelogram [/text/]
  if (inner.startsWith("/")) {
    if (!inner.endsWith("/") || inner.length < 2) {
      return { reason: "invalid-parallelogram", label, fix: quoteLabel(label) };
    }
    return null;
  }

  // trapezoid alt [\text\]
  if (inner.startsWith("\\")) {
    if (!inner.endsWith("\\") || inner.length < 2) {
      return { reason: "invalid-trapezoid-backslash", label, fix: quoteLabel(label) };
    }
    return null;
  }

  // trapezoid [/text\] or [\text/]
  if (inner.endsWith("\\") && !inner.startsWith("/")) {
    return { reason: "invalid-trapezoid-mixed", label, fix: quoteLabel(label) };
  }
  if (inner.endsWith("/") && !inner.startsWith("\\") && !inner.startsWith("/")) {
    return { reason: "invalid-trapezoid-slash-end", label, fix: quoteLabel(label) };
  }

  return null;
}

function scanMermaid(src) {
  const issues = [];
  for (const m of src.matchAll(/\[[^\[\]]*\]/g)) {
    const label = m[0];
    if (label.includes("<")) continue; // skip HTML-ish, often in <br/>
    const issue = analyzeBracketLabel(label);
    if (issue) issues.push(issue);
  }
  return issues;
}

function fixMermaid(src, issues) {
  let out = src;
  const labels = [...new Set(issues.map((i) => i.label))].sort((a, b) => b.length - a.length);
  for (const label of labels) {
    out = out.split(label).join(quoteLabel(label));
  }
  return out;
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

let total = 0;
let files = 0;

for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, "utf8");
  const re = /```mermaid\r?\n([\s\S]*?)```/g;
  let m;
  const edits = [];

  while ((m = re.exec(text)) !== null) {
    const block = m[1];
    const issues = scanMermaid(block);
    if (!issues.length) continue;
    total += issues.length;
    const rel = path.relative(ROOT, file);
    console.log(`${rel}:`);
    for (const i of issues) {
      console.log(`  [${i.reason}] ${i.label} -> ${i.fix}`);
    }
    if (!DRY) {
      const fixed = fixMermaid(block, issues);
      edits.push({
        start: m.index,
        end: m.index + m[0].length,
        replacement: "```mermaid\n" + fixed + "```",
      });
    }
  }

  if (edits.length && !DRY) {
    let newText = text;
    for (const e of edits.sort((a, b) => b.start - a.start)) {
      newText = newText.slice(0, e.start) + e.replacement + newText.slice(e.end);
    }
    fs.writeFileSync(file, newText, "utf8");
    files++;
  }
}

console.log(`\n${DRY ? "Dry run:" : "Done:"} ${total} issue(s) in ${files || "0"} file(s).`);
