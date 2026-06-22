#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Detect node labels like [/users/42] — invalid parallelogram on GitHub Mermaid */
function findBadSlashLabels(mermaid) {
  const issues = [];
  const re = /\[[^\[\]"']*\]/g;
  let m;
  while ((m = re.exec(mermaid)) !== null) {
    const label = m[0];
    if (!label.startsWith("[/")) continue;
    // valid parallelogram: [/text/]
    if (/^\[[^\]]+\/\]$/.test(label)) continue;
    issues.push({ label, index: m.index });
  }
  return issues;
}

function fixLabel(label) {
  const inner = label.slice(1, -1);
  const escaped = inner.replace(/"/g, '\\"');
  return `["${escaped}"]`;
}

function fixMermaidBlock(block) {
  let fixed = block;
  const issues = findBadSlashLabels(block);
  if (!issues.length) return { changed: false, block };

  // replace longest first to avoid partial overlaps
  for (const { label } of issues.sort((a, b) => b.label.length - a.label.length)) {
    fixed = fixed.split(label).join(fixLabel(label));
  }
  return { changed: true, block: fixed };
}

function* walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else if (ent.name.endsWith(".md")) yield p;
  }
}

let fileCount = 0;
let blockCount = 0;

for (const file of walk(ROOT)) {
  if (file.includes("_scripts")) continue;
  const text = fs.readFileSync(file, "utf8");
  const re = /```mermaid\n([\s\S]*?)```/g;
  let changed = false;
  let newText = text;
  const replacements = [];

  let m;
  while ((m = re.exec(text)) !== null) {
    const block = m[1];
    const { changed: c, block: fixed } = fixMermaidBlock(block);
    if (c) {
      blockCount++;
      replacements.push({ start: m.index, end: m.index + m[0].length, fixed: "```mermaid\n" + fixed + "```" });
    }
  }

  if (replacements.length) {
    // apply from end to start
    newText = text;
    for (const r of replacements.sort((a, b) => b.start - a.start)) {
      newText = newText.slice(0, r.start) + r.fixed + newText.slice(r.end);
    }
    fs.writeFileSync(file, newText, "utf8");
    fileCount++;
    console.log(path.relative(ROOT, file));
    for (const r of replacements) {
      const oldBlock = text.slice(r.start, r.end);
      const issues = findBadSlashLabels(oldBlock.match(/```mermaid\n([\s\S]*?)```/)[1]);
      for (const i of issues) console.log("  fix:", i.label, "->", fixLabel(i.label));
    }
  }
}

console.log(`\ndone. ${fileCount} files, ${blockCount} mermaid blocks fixed.`);
