#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// Mock hexo global object
global.hexo = {
  extend: {
    renderer: {
      register: function(ext, outputExt, fn, sync) {
        console.log(`✓ Renderer registered for .${ext} files`);
        this._renderer = fn;
      }
    }
  }
};

// Load the renderer
require('./index.js');

// Test the renderer with advanced features
async function testAdvanced() {
  console.log('\n=== Testing Advanced MDX Features ===\n');
  
  try {
    // Read test MDX file
    const mdxPath = path.join(__dirname, 'test', 'advanced.mdx');
    const mdxContent = fs.readFileSync(mdxPath, 'utf8');
    
    console.log('Input: advanced.mdx with components and dynamic content\n');
    
    // Render the MDX
    const data = {
      text: mdxContent,
      path: mdxPath
    };
    
    console.log('Rendering...\n');
    const html = await global.hexo.extend.renderer._renderer(data);
    
    console.log('Output HTML:');
    console.log('---');
    console.log(html);
    console.log('---\n');
    
    // Validations
    const checks = [
      { test: html.includes('<button'), desc: 'Custom Button components' },
      { test: html.includes('background-color'), desc: 'Inline styles (kebab-case)' },
      { test: html.includes('apple'), desc: 'Dynamic map content' },
      { test: html.includes('box-shadow'), desc: 'Card component styles (kebab-case)' },
      { test: !html.includes('---'), desc: 'Front matter stripped' },
      { test: html.includes('<h1'), desc: 'Markdown headings' },
      { test: html.includes('<li'), desc: 'Markdown lists' },
    ];
    
    console.log('Validation checks:');
    checks.forEach(({ test, desc }) => {
      console.log(`  ${test ? '✓' : '✗'} ${desc}`);
    });
    
    const allPassed = checks.every(c => c.test);
    
    if (allPassed) {
      console.log('\n=== All tests passed! ===\n');
    } else {
      console.log('\n=== Some tests failed ===\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAdvanced();
