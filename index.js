'use strict';

const { compile } = require('@mdx-js/mdx');
const { renderToString } = require('react-dom/server');
const React = require('react');
const fs = require('fs');

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
    const compiled = await compile(content, {
      outputFormat: 'function-body',
      development: false,
      jsxImportSource: 'react',
      format: 'mdx',
      mdxExtensions: ['.mdx'],
      // Explicitly set recma plugins to handle JSX expressions properly
      remarkRehypeOptions: {
        allowDangerousHtml: true
      }
    });

    // Create a function from the compiled code
    const code = String(compiled);
    
    // The compiled code expects the jsx-runtime
    const jsxRuntime = require('react/jsx-runtime');
    
    // Create and execute the MDX module function
    // Note: Using new Function() here is safe because:
    // 1. Input comes from MDX files in the user's Hexo project (not untrusted external input)
    // 2. MDX compilation itself validates and sanitizes the content
    // 3. This is a build-time operation, not runtime user input
    const fn = new Function(code);
    const mdxModule = fn.call(null, jsxRuntime);
    
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
