import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

/** After the build, stamps public/sw.js with the list of emitted files and a content hash. */
function precache() {
  let out;
  return {
    name: 'gigachad-precache',
    apply: 'build',
    configResolved(c) { out = c.build.outDir; },
    closeBundle() {
      const files = walk(out)
        .map((p) => ({ p, url: '/' + relative(out, p).split('\\').join('/') }))
        .filter((f) => f.url !== '/sw.js' && f.url !== '/robots.txt')
        // fonts for non-latin scripts stay out of the offline bundle; they are cached on first use
        .filter((f) => !/-(latin-ext|cyrillic|cyrillic-ext|greek|greek-ext|vietnamese)-/.test(f.url))
        .sort((a, b) => (a.url < b.url ? -1 : 1));
      const hash = createHash('sha256');
      files.forEach((f) => hash.update(f.url).update(readFileSync(f.p)));
      const sw = join(out, 'sw.js');
      const urls = ['/', ...files.map((f) => f.url)];
      writeFileSync(sw, readFileSync(sw, 'utf8')
        .replace("'__VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 10)))
        .replace("'__PRECACHE__'", urls.map((u) => JSON.stringify(u)).join(',')));
    },
  };
}

export default defineConfig({
  plugins: [svelte(), precache()],
  build: { target: 'es2022' },
});
