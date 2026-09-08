#!/usr/bin/env node
/**
 * validate.mjs — flow.json 结构校验
 * Usage: node validate.mjs <path-to-flow.json>
 * Exit 0 = valid, Exit 1 = invalid (prints ✗ lines)
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("✗ usage: node validate.mjs <flow.json>");
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(file, "utf8");
} catch (e) {
  console.error(`✗ cannot read file: ${e.message}`);
  process.exit(1);
}

if (raw.charCodeAt(0) === 0xfeff) {
  console.error("✗ file has UTF-8 BOM — rewrite without BOM");
  process.exit(1);
}

let f;
try {
  f = JSON.parse(raw);
} catch (e) {
  console.error(`✗ invalid JSON: ${e.message}`);
  process.exit(1);
}

const errs = [];
const ids = new Set();

if (!f.project || typeof f.project !== "string") errs.push("project missing/not string");
if (!f.generatedAt || typeof f.generatedAt !== "string") errs.push("generatedAt missing (ISO 8601 required)");
else if (Number.isNaN(Date.parse(f.generatedAt))) errs.push("generatedAt not parseable as date");
if (!Array.isArray(f.nodes) || f.nodes.length === 0) errs.push("nodes missing/empty");
if (!Array.isArray(f.edges)) errs.push("edges missing/not array");

const KINDS = new Set(["stage", "module", "decision", "artifact", "detail"]);
for (const n of f.nodes ?? []) {
  if (!n.id || typeof n.id !== "string") { errs.push(`node missing id: ${JSON.stringify(n).slice(0, 60)}`); continue; }
  if (ids.has(n.id)) errs.push(`duplicate id: ${n.id}`);
  ids.add(n.id);
  if (!n.title || typeof n.title !== "string") errs.push(`${n.id}: title missing`);
  if (!n.body || typeof n.body !== "string") errs.push(`${n.id}: body missing`);
  else if (n.body.length < 30) errs.push(`${n.id}: body too short (<30 chars) — add real detail`);
  if (n.kind && !KINDS.has(n.kind)) errs.push(`${n.id}: unknown kind '${n.kind}'`);
}

let dangling = 0;
for (const [i, e] of (f.edges ?? []).entries()) {
  if (!ids.has(e.source)) { errs.push(`edge[${i}]: dangling source '${e.source}'`); dangling++; }
  if (!ids.has(e.target)) { errs.push(`edge[${i}]: dangling target '${e.target}'`); dangling++; }
  if (e.source === e.target) errs.push(`edge[${i}]: self-loop on '${e.source}'`);
}

if (errs.length) {
  for (const e of errs) console.error(`✗ ${e}`);
  console.error(`✗ invalid flow file: ${errs.length} problem(s)`);
  process.exit(1);
}

console.log(`✓ valid flow file: ${f.nodes.length} nodes, ${f.edges.length} edges, project '${f.project}'`);
