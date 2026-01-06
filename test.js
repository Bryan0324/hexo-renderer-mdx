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

// Test the renderer
async function test() {
  console.log('\n=== Testing hexo-renderer-mdx ===\n');
  
  try {
    // Read test MDX file
    const mdxPath = path.join(__dirname, 'test', 'basic.mdx');
    const mdxContent = fs.readFileSync(mdxPath, 'utf8');
    
    console.log('Input MDX:');
    console.log('---');
    console.log(mdxContent.substring(0, 200) + '...');
    console.log('---\n');
    
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
    
    // Basic validation
    if (html.includes('<div')) {
      console.log('✓ JSX elements rendered correctly');
    }
    if (html.includes('<h1')) {
      console.log('✓ Markdown headings rendered correctly');
    }
    if (html.includes('<li')) {
      console.log('✓ Markdown lists rendered correctly');
    }
    
    console.log('\n=== Test completed successfully! ===\n');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
