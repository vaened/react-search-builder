#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const cwd = process.cwd();
const pkgFile = path.join(cwd, "package.json");
const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));

if (!pkg.exports || typeof pkg.exports !== "object") {
  console.log(`[verify:pack] ${pkg.name}: no exports field, skipping`);
  process.exit(0);
}

const expectedTargets = [...new Set(collectLeafStrings(pkg.exports).filter((target) => target.startsWith("./")).map(stripDotSlash))];

const cacheDir = path.join(os.tmpdir(), "npm-cache-react-search-builder");
mkdirSync(cacheDir, { recursive: true });

const pack = spawnSync("npm", ["pack", "--json"], {
  cwd,
  encoding: "utf8",
  env: {
    ...process.env,
    npm_config_cache: cacheDir,
  },
});

if (pack.status !== 0) {
  const stderr = pack.stderr?.trim();
  const stdout = pack.stdout?.trim();
  console.error(stderr || stdout || "npm pack failed");
  process.exit(pack.status ?? 1);
}

let parsed;
try {
  parsed = JSON.parse(pack.stdout);
} catch (error) {
  console.error(`[verify:pack] ${pkg.name}: unable to parse npm pack output`);
  throw error;
}

const descriptor = Array.isArray(parsed) ? parsed[0] : parsed;
const files = new Set((descriptor.files ?? []).map((entry) => entry.path));
const missing = expectedTargets.filter((target) => !files.has(target));
const packedPackage = readPackedPackageJson(cwd, descriptor.filename);
const workspaceProtocolDependencies = collectWorkspaceProtocolDependencies(packedPackage);

if (descriptor.filename) {
  rmSync(path.join(cwd, descriptor.filename), { force: true });
}

if (missing.length > 0) {
  console.error(`[verify:pack] ${pkg.name}: missing export files in packed tarball`);
  for (const target of missing) {
    console.error(` - ${target}`);
  }
  process.exit(1);
}

if (workspaceProtocolDependencies.length > 0) {
  console.error(`[verify:pack] ${pkg.name}: packed package.json contains workspace protocol dependencies`);
  for (const entry of workspaceProtocolDependencies) {
    console.error(` - ${entry}`);
  }
  process.exit(1);
}

console.log(`[verify:pack] ${pkg.name}: ok (${expectedTargets.length} export targets found in tarball)`);

function collectLeafStrings(node) {
  if (typeof node === "string") {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item) => collectLeafStrings(item));
  }

  if (!node || typeof node !== "object") {
    return [];
  }

  return Object.values(node).flatMap((item) => collectLeafStrings(item));
}

function stripDotSlash(value) {
  return value.startsWith("./") ? value.slice(2) : value;
}

function readPackedPackageJson(cwd, filename) {
  if (!filename) {
    return null;
  }

  const tarballPath = path.join(cwd, filename);
  const extracted = spawnSync("tar", ["-xOf", tarballPath, "package/package.json"], {
    cwd,
    encoding: "utf8",
  });

  if (extracted.status !== 0 || !extracted.stdout) {
    console.error(`[verify:pack] ${pkg.name}: unable to inspect packed package.json`);
    process.exit(extracted.status ?? 1);
  }

  return JSON.parse(extracted.stdout);
}

function collectWorkspaceProtocolDependencies(packedPackage) {
  if (!packedPackage || typeof packedPackage !== "object") {
    return [];
  }

  const sections = ["dependencies", "optionalDependencies", "peerDependencies"];
  const invalid = [];

  for (const section of sections) {
    const dependencies = packedPackage[section];
    if (!dependencies || typeof dependencies !== "object") {
      continue;
    }

    for (const [name, version] of Object.entries(dependencies)) {
      if (typeof version === "string" && version.startsWith("workspace:")) {
        invalid.push(`${section}.${name}=${version}`);
      }
    }
  }

  return invalid;
}
