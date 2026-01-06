const { compile } = require('@mdx-js/mdx');

const testContent = `---
title: My First MDX Post
date: 2026-01-06
tags: [hexo, mdx]
---

# Hello

<div style={{ padding: '20px', backgroundColor: '#e3f2fd' }}>
  🎉 Test
</div>
`;

async function test() {
  try {
    // Strip front matter like the renderer does
    let content = testContent;
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    
    if (match) {
      content = content.slice(match[0].length);
    }
    
    console.log('Content to compile:');
    console.log(content);
    console.log('\n---\n');
    
    const result = await compile(content, {
      outputFormat: 'function-body',
      development: false,
      jsxImportSource: 'react',
      format: 'mdx',
      mdxExtensions: ['.mdx'],
      remarkRehypeOptions: {
        allowDangerousHtml: true
      }
    });
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
