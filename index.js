'use strict';

const { compile } = require('@mdx-js/mdx');
const { renderToString } = require('react-dom/server');
const React = require('react');

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
    // Strip YAML front matter if present
    // Hexo usually handles this, but we need to be safe
    let content = text;
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
      jsxImportSource: 'react'
    });

    // Create a function from the compiled code
    const code = String(compiled);
    
    // The compiled code expects arguments[0] to be the jsx-runtime
    const jsxRuntime = require('react/jsx-runtime');
    
    // Create and execute the MDX module function
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
    throw new Error(`MDX compilation failed for ${path}: ${err.message}`);
  }
}

/**
 * Register the MDX renderer with Hexo
 */
hexo.extend.renderer.register('mdx', 'html', mdxRenderer, true);
