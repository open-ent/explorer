#!/usr/bin/env node
/**
 * Prépare la publication de la LIB explorer en `@open-ent/explorer` sur GitHub
 * Packages, SANS toucher la source (qui reste `ode-explorer` + `@edifice.io/*`
 * pour le dev local et le build du bundle).
 *
 * Exécuté APRÈS `vite build --mode lib`, sur le checkout CI :
 * - package.json : name `ode-explorer` -> `@open-ent/explorer`, deps internes
 *   `@edifice.io/*` -> `@open-ent/*`, publishConfig -> GitHub Packages, version.
 * - lib/ (sortie ESM + .d.ts) : imports `@edifice.io/*` -> `@open-ent/*`.
 *
 * Usage : node scripts/prepare-openent-explorer-publish.mjs [version]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FROM = '@edifice.io/';
const TO = '@open-ent/';
const REGISTRY = 'https://npm.pkg.github.com';
const version = process.argv[2];
const DEP_KEYS = ['dependencies', 'peerDependencies', 'optionalDependencies'];
const ren = (s) => s.split(FROM).join(TO);
// Les deps @edifice (souvent en dist-tag `develop-pedago`) deviennent @open-ent :
// il faut pointer sur une VERSION publiée du fork (le dist-tag develop-pedago
// n'existe pas côté @open-ent). Aligné sur la version des packages framework.
const OPENENT_DEPS_RANGE = '^2.5.22';

// package.json
const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = '@open-ent/explorer';
if (version) pkg.version = version;
for (const key of DEP_KEYS) {
  if (!pkg[key]) continue;
  const out = {};
  for (const [name, spec] of Object.entries(pkg[key])) {
    const nn = ren(name);
    // deps internes @open-ent -> version publiée (pas le dist-tag @edifice d'origine)
    out[nn] = nn.startsWith(TO) ? OPENENT_DEPS_RANGE : spec;
  }
  pkg[key] = out;
}
// pnpm.overrides locaux (link:) sont inutiles dans le package publié
delete pkg.pnpm;
pkg.publishConfig = { ...(pkg.publishConfig || {}), registry: REGISTRY, access: 'restricted' };
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`renamed -> ${pkg.name}@${pkg.version}`);

// lib/ : renomme les imports @edifice.io -> @open-ent dans la sortie
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(js|mjs|cjs|d\.ts|map)$/.test(entry)) {
      const c = readFileSync(p, 'utf8');
      if (c.includes(FROM)) writeFileSync(p, ren(c));
    }
  }
}
try {
  statSync(join(ROOT, 'lib'));
  walk(join(ROOT, 'lib'));
  console.log('lib/ imports renamed');
} catch {
  console.warn('pas de lib/ — build --mode lib manquant ?');
}
