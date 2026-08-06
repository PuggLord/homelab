// Cuts the three webfonts down to the characters this page actually sets.
//
// The full latin subsets were 51 KB between them and arrive at the same moment
// as the hero image, so they were the thing pushing largest-contentful-paint
// past its budget on a throttled connection. Restricted to printable ASCII plus
// the handful of punctuation marks used, they come to 23 KB.
//
// Needs fonttools and brotli:  pip install fonttools brotli
// Then:  npm run fonts
import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync, existsSync, statSync } from 'node:fs';

const FACES = ['petrona-300', 'hanken-400', 'hanken-500'];
const UNICODES = 'U+0020-007E,U+00A0,U+00B7,U+00D7,U+2013,U+2014,U+2018-201D,U+2026';
const SRC = 'fonts-full';   // the unsubset originals live here
const OUT = 'docs/fonts';

if (!existsSync(SRC)) {
  console.error(`No ${SRC}/ directory. Put the full woff2 files there first —`);
  console.error('subsetting an already-subset file only ever loses more glyphs.');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

for (const face of FACES) {
  const from = `${SRC}/${face}.woff2`;
  const to   = `${OUT}/${face}.woff2`;
  execFileSync('py', ['-3.12', '-m', 'fontTools.subset', from,
    `--unicodes=${UNICODES}`,
    '--layout-features=kern,liga,clig,rlig',
    '--flavor=woff2', `--output-file=${to}`,
    '--no-hinting', '--desubroutinize'], { stdio: 'inherit' });
  console.log(`${face}: ${statSync(from).size} -> ${statSync(to).size} bytes`);
}
