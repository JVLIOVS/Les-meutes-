import {mkdir,rm,cp,readdir,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('web','dist',{recursive:true});
for(const file of await readdir('dist'))if(file.endsWith('.js')){const path='dist/'+file;await writeFile(path,(await readFile(path,'utf8')).replace(/from '(\.\/[^']+\.js)'/g,"from '$1?v=03'"));}
const html=await readFile('dist/index.html','utf8');await writeFile('dist/index.html',html.replace('./style.css','./style.css?v=03').replace('./app.js','./app.js?v=03'));
console.log('EMMET · Prototype 03 · static build ready');
