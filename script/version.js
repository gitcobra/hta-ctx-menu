import { readFile, writeFile } from 'fs/promises';


// load the json object

let path = new URL('../res/version.json', import.meta.url).pathname.substring(1);
let txt = await readFile(path);
const Ver = JSON.parse(txt);
// update the build number
Ver.build++;
await writeFile( path, JSON.stringify(Ver, null, '  ') );

// update the version field in package.json
path = new URL('../package.json', import.meta.url).pathname.substring(1);
txt = await readFile(path);
const Package = JSON.parse(txt);
Package.version = `${Ver.major}.${Ver.minor}.${Ver.build}${Ver.tag}`;
await writeFile( path, JSON.stringify(Package, null, '  ') );

//console.log(Ver);
