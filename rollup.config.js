import fs from "fs";

// typescript
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

// to load resources
import loadHtml from "rollup-plugin-html";
import json from "@rollup/plugin-json";

// clearn up tools
import del from "rollup-plugin-delete";
import cleanup from "rollup-plugin-cleanup";
import strip from "@rollup/plugin-strip";
import replace from '@rollup/plugin-replace';




// development flag
const DEV = !!process.env.ROLLUP_WATCH;
const BUILD_DEV = !!process.env.NODE_BUILD_DEV;
const RELEASE = !!process.env.NODE_BUILD_RELEASE;

// bundle file namey
const bundleName = `hta-ctx-menu`;
// destination
const dist = `${RELEASE ? 'release' : 'dist'}${BUILD_DEV ? '/dev' : ''}`;
// entry file
//const entryFilePath = `./src/entry.ts`;
//const entryDtsPath = `./${dist}/dts/src/entry.d.ts`;
// output formats
const formats = ['iife', 'es'];
// global name for the constructor
const GLOBAL_NAME = 'HTAContextMenu';




// sites
const GITHUB_URL = `https://github.com/gitcobra/${bundleName}`;
// banner
let BANNER_TXT = '';
if( !DEV ) {
  const Ver = JSON.parse(fs.readFileSync('./res/version.json'));
  const VERSION_TXT = `${Ver.major}.${Ver.minor}.${String(Ver.build)}${Ver.tag}`;

  BANNER_TXT = `/*
  title: ${bundleName}
  version: ${VERSION_TXT}
  github: ${GITHUB_URL}
*/`;
}

const CommonPlugins = [
  json({compact: true}),
  
  loadHtml({
    include: [
      "res/**/*html",
      "res/*.css",
    ],
    htmlMinifierOptions: {
      removeComments: true,
      collapseWhitespace: true,
      minifyCSS: true,
    },
  }),
  
  // unfortunately rollup-plugin-json uses Object.freeze (that doesn't work on HTA of course).
  // so it replaces "Object.freeze({...})" with "Object({...})".
  replace({
    'Object.freeze': 'Object',
    preventAssignment: true,
  }),
];


const BuildConfig = [];
formats.forEach(format => {
  const formatFileName = format === 'es' ? 'esm' : format;
  const baseFileName = `${dist}/${bundleName}${format !== 'iife' ? '.' + formatFileName : ''}`;

  // entry file
  const entryFilePath = `./src/entry.${format}.ts`;
  const entryDtsPath = `./${dist}/dts/src/entry.${format}.d.ts`;

  BuildConfig.push({
    input: [entryFilePath],

    output: {
      format: format,
      file: `${baseFileName}.js`,
      name: GLOBAL_NAME,
      sourcemap: false,
      esModule: false,
      banner: BANNER_TXT
    },

    plugins: [
      ...!DEV ? [del({
        targets: [`${baseFileName}.*`, `${dist}/dts`],
        hook: 'buildStart',
        verbose: true
      }),] : [],

      typescript({
        //"exclude": ["./test/*.ts"],
        "compilerOptions": {
          "declaration": true,
          //"outDir": "tmp",
          "declarationDir": "dts",
          
          "noUnusedParameters": false,
          "noUnusedLocals": false,
        },
      }),

      ...CommonPlugins,

      // remove DEV blocks
      ...!(DEV || BUILD_DEV) ? [
        strip({
          include: ["**/*.js", "**/*.ts"],
          labels: ["DEV"],
        }),
        cleanup()
      ] : [],
    ],
    onwarn: suppress_warnings,
    //watch: {clearScreen: false},
  }, {
  // bundle d.ts files
    input: [
      entryDtsPath
    ],
    output: [
      { file: `${dist}/${bundleName}${format !== 'iife' ? '.' + formatFileName : ''}.d.ts` },
    ],

    plugins: [
      dts({respectExternal:true}),
      
      ...!DEV ? [del({
        targets: [`${dist}/dts`],
        hook: 'buildEnd'
      })] : [],
    ]
    //watch: {clearScreen: false},
  });
});


// for test folder's ts files. they are output to the same folder.
if( DEV ) {
  const externalId = new URL('./dist/hta-ctx-menu', import.meta.url).pathname.substring(1).replace(/\//g, '\\');
  const TEST_SRC = './test/';
  // create output settings for each file in the test folder
  fs.readdirSync(TEST_SRC).forEach(async (file) => {
    if( !fs.statSync(TEST_SRC + file).isFile() || !/\.ts$/i.test(file) )
      return;
    
    BuildConfig.push({
      input: [TEST_SRC + file],
      external: ['../dist/hta-ctx-menu'],
      output: {
        format: "iife",
        dir: './test',
        sourcemap: false,
        globals: {
          [externalId]: "HTAContextMenu",
        },
      },

      plugins: [
        typescript({
          "compilerOptions": {
            "declaration": false,
            "noUnusedParameters": false,
            "noUnusedLocals": false,
          }
        }),
        ...CommonPlugins,
      ],
      
      onwarn: suppress_warnings,
      watch: {clearScreen: false},
    });
  });
}

export default BuildConfig;




function suppress_warnings(warning, defaultHandler) {
  if (warning.code === 'THIS_IS_UNDEFINED')
    return;
  
  defaultHandler(warning);
}
