// parse html templates for menu items, and convert them as JSON

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { parse } from "node-html-parser";

const TEMPLATES_PATH = '../html-templates/';
const OUTPUT_PATH = '../res/';

const dir = new URL(TEMPLATES_PATH, import.meta.url).pathname.substring(1);
const outdir = new URL(OUTPUT_PATH, import.meta.url).pathname.substring(1);

const files = readdirSync(dir);
let count = 0;
files.forEach((file) => {
  if( !/.html$/i.test(file) ) //ignore all except html
    return;
  
  console.log(count + 1);
  console.log(`loading html "${dir + file}"`);
  const data = readFileSync(dir + file, {encoding: 'utf8'});
  const dom = parse(data.replace(/^\s+|\s+$/g, ''), {
    comment: false,
  });
  
  const obj = digNodes(dom, true);

  console.log(`saving json "${outdir + file}.json"`);
  writeFileSync(outdir + file + '.json', JSON.stringify(obj, null, 2));
  count++;
});

console.log(`converted ${count} html templates to json.`);





function digNodes({tagName, id, classList, childNodes, attributes}, root) {
  // set attributes
  const obj = { tag: tagName };
  for( const attr in attributes ) {
    obj.attr = attributes;
  }
  
  // parse child nodes
  const childs = [];
  childNodes.forEach((node) => {
    if( node.nodeType !== 1 )
      return;
    
    childs.push( digNodes(node, false) );
  });
  if( childs.length )
    obj.children = childs;

  // return the first HTMLElement found if root flag is true 
  return root ? childs[0] : obj;
}
