'use strict';

const { renderToString } = require('react-dom/server');
const React = require('react');
const fs = require('fs');
const { createRequire } = require('module');

// Create a require for loading ESM modules
let compile;
let compileLoaded = false;

async function loadCompile() {
  if (!compileLoaded) {
    try {
      // Try to load @mdx-js/mdx - it may be CJS or ESM depending on the environment
      try {
        // First try: dynamic import with proper error handling
        const mdxModule = await (async () => {
          try {
            return await import('@mdx-js/mdx');
          } catch (err) {
            // If dynamic import fails, this might be a require context issue
            // Return null to trigger fallback
            return null;
          }
        })();
        
        if (mdxModule) {
          compile = mdxModule.compile;
        } else {
          throw new Error('Could not load @mdx-js/mdx via dynamic import');
        }
      } catch (err) {
        // Fallback: try to require it directly (in case it's been transpiled)
        compile = require('@mdx-js/mdx').compile;
      }
      compileLoaded = true;
    } catch (err) {
      throw new Error(`Failed to load @mdx-js/mdx: ${err.message}`);
    }
  }
}

/**
 * MDX Renderer for Hexo
 * 
 * This renderer allows you to use MDX files in your Hexo blog.
 * MDX is markdown with JSX support, allowing you to embed React components.
 */

/**
 * Render MDX content to HTML
 * @param {Object} data - The data object containing MDX content
 * @param {string} data.text - The MDX content to render
 * @param {string} data.path - The file path (for error reporting)
 * @returns {Promise<string>} The rendered HTML
 */
async function mdxRenderer(data) {
  const { text, path } = data;
  
  try {
    // Ensure compile function is loaded
    await loadCompile();
    
    // Read the original file directly to bypass Hexo's template processing
    let content;
    try {
      content = fs.readFileSync(path, 'utf8');
    } catch (err) {
      // If reading fails, fall back to the provided text
      content = text;
    }
    
    // Strip YAML front matter if present
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    
    if (match) {
      // Remove front matter from content
      content = content.slice(match[0].length);
    }
    
    // Compile MDX to JavaScript with automatic JSX runtime
    // Use outputFormat: 'function-body' and development: true to avoid jsxImportSource
    const compiled = await compile(content, {
      outputFormat: 'function-body',
      development: true,
      // remarkRehypeOptions for markdown processing
      remarkRehypeOptions: {
        allowDangerousHtml: true
      }
    });

    // Create a function from the compiled code
    const code = String(compiled);
    
    // When development: true, the compiled code uses jsxDEV from react/jsx-dev-runtime
    const jsxDevRuntime = require('react/jsx-dev-runtime');
    
    // Create and execute the MDX module function
    // Note: Using new Function() here is safe because:
    // 1. Input comes from MDX files in the user's Hexo project (not untrusted external input)
    // 2. MDX compilation itself validates and sanitizes the content
    // 3. This is a build-time operation, not runtime user input
    const fn = new Function(code);
    const mdxModule = fn.call(null, jsxDevRuntime);
    
    // The result has a default export which is the MDX component
    const MDXContent = mdxModule.default;
    
    // Render the component to static HTML
    const html = renderToString(
      React.createElement(MDXContent, {})
    );
    
    return html;
  } catch (err) {
    // Provide more detailed error information
    const errorMsg = `MDX compilation failed for ${path}: ${err.message}`;
    console.error(errorMsg);
    if (err.position) {
      console.error(`Error at line ${err.position.start.line}, column ${err.position.start.column}`);
    }
    throw new Error(errorMsg);
  }
}

/**
 * Register the MDX renderer with Hexo
 * Note: Using disableNunjucks: true to prevent template processing of {{ }} syntax
 */
hexo.extend.renderer.register('mdx', 'html', mdxRenderer, {
  disableNunjucks: true
});
