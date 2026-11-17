import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
for (const name of ['validate','suggest','inline','all']) {
  const bytes = readFileSync(`dist/${name}.min.js`);
  console.log(`${name}: ${bytes.length} B min, ${gzipSync(bytes).length} B gzip`);
}
