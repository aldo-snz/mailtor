import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=process.cwd();
createServer(async(req,res)=>{
 let path=decodeURIComponent((req.url??'/').split('?')[0]);
 if(path==='/'||path==='/playground/') path='/playground/index.html';
 const full=resolve(root,'.'+path);
 if(!full.startsWith(root+'/')){res.writeHead(403).end();return;}
 try{const bytes=await readFile(full);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[extname(full)]??'application/octet-stream');res.end(bytes);}catch{res.writeHead(404).end('No encontrado');}
}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173/playground/'));
