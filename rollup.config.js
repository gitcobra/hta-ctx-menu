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

// global name for the constructor
const GLOBAL_NAME = 'HTAContextMenu';
// bundle file name
const bundleName = `hta-ctx-menu`;
// destination
const dist = `${RELEASE ? 'release' : 'dist'}${BUILD_DEV ? '/dev' : ''}`;

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
  
  // HACK: 
  // unfortunately rollup-plugin-json uses Object.freeze (that doesn't work on HTA of course).
  // so it replaces "Object.freeze({...})" with "Object({...})".
  replace({
    'Object.freeze': 'Object',
    preventAssignment: true,
  }),
];


const BuildConfig = [
  {
    input: ["src/entry.ts"],

    output: {
      format: "umd",
      file: `${dist}/${bundleName}.js`,
      name: GLOBAL_NAME,
      sourcemap: false,
      esModule: false,
    },

    plugins: [
      ...!DEV ? [del({
        targets: [`${dist}/*.js`, `${dist}/*.ts`, `${dist}/dts`],
        hook: 'buildStart',
        verbose: true
      }),] : [],

      ...CommonPlugins,

      typescript({
        // FIXME: actually the test folder is not required here but when a single source folder is specified, a compile error occurs for some reason
        //"exclude": ["./test/*.ts"],
        "compilerOptions": {
          "declaration": true,
          "outDir": "tmp",
          "declarationDir": "dts",
          
          "noUnusedParameters": false,
          "noUnusedLocals": false,
        },
      }),


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
  },
  
  // bundle d.ts files
  {
    input: [
      `${dist}/dts/src/entry.d.ts`
    ],
    output: [
      { file: `${dist}/${bundleName}.d.ts` },
    ],

    plugins: [
      dts({respectExternal:true}),
      
      ...!DEV ? [del({
        targets: [`${dist}/dts`],
        hook: 'buildEnd'
      })] : [],
    ]
    //watch: {clearScreen: false},
  }
];


// for test folder's ts files. they export same folder.
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
