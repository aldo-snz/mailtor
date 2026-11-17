import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {mkdirSync} from 'node:fs';
mkdirSync('dist', {recursive: true});
execFileSync('node', ['node_modules/typescript/bin/tsc'], {stdio:'inherit'});
for (const [name, entry] of [['validate','src/validate.ts'],['suggest','src/suggest.ts'],['inline','src/inline.ts'],['all','src/index.ts']]) {
  await build({entryPoints:[entry], outfile:`dist/${name}.min.js`, bundle:true, format:'esm', minify:true, target:'es2022', legalComments:'none'});
}
await build({entryPoints:['src/index.ts','src/inline.ts'], outdir:'dist/browser', bundle:true, splitting:true, format:'esm', target:'es2022', entryNames:'[name]', chunkNames:'chunks/[name]-[hash]'});
await build({entryPoints:['src/browser.ts'], outfile:'dist/mailtor.browser.js', bundle:true, format:'iife', globalName:'Mailtor', minify:true, target:'es2022'});
await build({entryPoints:['playground/app.ts'], outfile:'playground/app.js', bundle:true, format:'esm', target:'es2022'});
