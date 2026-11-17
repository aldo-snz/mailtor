import {performance} from 'node:perf_hooks';
import {cpus} from 'node:os';
import {validateEmail,suggestEmail} from '../dist/index.js';
import validator from 'validator';
import Mailcheck from 'mailcheck';
const inputs=['ana@gmail.com','Ana.Perez+tag@empresa.com','ana@gmial.com','ana@example..com','x'.repeat(1025)];
const loops=5000;
for (const [name,fn] of [['Mailtor validate',validateEmail],['validator isEmail',validator.isEmail],['Mailtor suggest',suggestEmail],['Mailcheck suggest',email=>Mailcheck.run({email,suggested:()=>{},empty:()=>{}})]]){
 for(let i=0;i<1000;i++)fn(inputs[i%inputs.length]);
 const start=performance.now();for(let i=0;i<loops;i++)fn(inputs[i%inputs.length]);
 console.log(`${name}: ${(performance.now()-start).toFixed(2)} ms / ${loops} calls`);
}
console.log(JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,cpu:cpus()[0]?.model,versions:{validator:'13.15.35',mailcheck:'1.1.1'},inputs,loops},null,2));
