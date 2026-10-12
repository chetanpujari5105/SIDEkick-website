// Regenerates src/components/icons.ts from lucide-static (ISC). Add a name to `names`, then run:
//   node scripts/gen-icons.cjs
const fs = require('fs');
const path = require('path');
const names = require('./icon-names.json');
const dir = path.join(__dirname, '..', 'node_modules', 'lucide-static', 'icons');
const out = {};
for (const n of names) {
  const s = fs.readFileSync(path.join(dir, n + '.svg'), 'utf8');
  out[n] = s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
}
fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'components', 'icons.ts'),
  '// Generated from lucide-static (ISC licence, https://lucide.dev). Regenerate with scripts/gen-icons.cjs.\n' +
    'export const icons: Record<string, string> = ' + JSON.stringify(out, null, 2) + ';\n',
);
console.log(`${names.length} icons written`);
