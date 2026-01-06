'use strict';

const { compile } = require('@mdx-js/mdx');
const fs = require('fs');
const path = require('path');

async function inspect() {
  const mdxPath = path.join(__dirname, 'test', 'basic.mdx');
  const mdxContent = fs.readFileSync(mdxPath, 'utf8');
  
  const compiled = await compile(mdxContent, {
    outputFormat: 'function-body',
    development: false,
    jsxImportSource: 'react'
  });
  
  console.log('Compiled MDX code:');
  console.log('---');
  console.log(String(compiled));
  console.log('---');
  
  // Try to execute it
  const code = String(compiled);
  const jsxRuntime = require('react/jsx-runtime');
  const fn = new Function(code);
  const result = fn.call(null, jsxRuntime);
  
  console.log('\nResult type:', typeof result);
  console.log('Result:', result);
  console.log('Result keys:', Object.keys(result || {}));
}

inspect().catch(console.error);
