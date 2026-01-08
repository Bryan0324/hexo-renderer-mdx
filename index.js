'use strict';

const { renderToString } = require('react-dom/server');
const React = require('react');
const fs = require('fs');
const { createRequire } = require('module');
const { pathToFileURL, fileURLToPath } = require('url');

let babelRegistered = false;
function ensureBabelRegister(filePath) {
  if (babelRegistered) return;
  const localRequire = createRequire(filePath);
  let babelRegister;
  try {
    babelRegister = localRequire('@babel/register');
  } catch (errLocal) {
    try {
      babelRegister = require('@babel/register');
    } catch (errGlobal) {
      throw new Error(
        'Failed to set up Babel register: please install @babel/register (and babel plugins) in your Hexo project or renderer package.'
      );
    }
  }
  babelRegister({
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      ['@babel/plugin-transform-react-jsx', {
        runtime: 'automatic'
      }]
    ],
    ignore: [/node_modules/]
  });
  babelRegistered = true;
}

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
  const { text, path: filePath } = data;
  
  try {
    // Ensure Babel can handle JSX/TS imports from MDX files (e.g., local components).
    ensureBabelRegister(filePath);

    // Ensure compile function is loaded
    await loadCompile();
    
    // Read the original file directly to bypass Hexo's template processing
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
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
      baseUrl: pathToFileURL(filePath),
      // remarkRehypeOptions for markdown processing
      remarkRehypeOptions: {
        allowDangerousHtml: true
      }
    });

    // Create a function from the compiled code
    const code = String(compiled);
    
    // When development: true, the compiled code uses jsxDEV from react/jsx-dev-runtime
    const jsxDevRuntime = require('react/jsx-dev-runtime');
    
    // Replace dynamic imports with a shim that resolves relative to the MDX file and uses require to stay in CJS.
    const toModuleNamespace = (mod) => {
      // If it already looks like an ES module with a default export, return as-is
      if (mod && typeof mod === 'object' && 'default' in mod) return mod;
      // For CJS modules, wrap as ES module: spread first, then set default to ensure it's not overwritten
      if (mod && typeof mod === 'object') {
        return { ...mod, default: mod };
      }
      // For primitive or function values, just set as default
      return { default: mod };
    };
    const dynamicImport = (specifier) => {
      const asString = String(specifier);
      const req = createRequire(filePath);
      // Check if it's already a file:// URL string
      if (asString.startsWith('file://')) {
        try {
          const fsPath = fileURLToPath(asString);
          return Promise.resolve(toModuleNamespace(req(fsPath)));
        } catch (err) {
          // Re-throw with better error message
          throw new Error(`Failed to require file:// URL: ${err.message}`);
        }
      }
      try {
        // Try to construct a URL to see if it's relative
        const resolvedUrl = new URL(asString, pathToFileURL(filePath));
        if (resolvedUrl.protocol === 'file:') {
          return Promise.resolve(toModuleNamespace(req(fileURLToPath(resolvedUrl))));
        }
        return Promise.resolve(toModuleNamespace(req(asString)));
      } catch (urlErr) {
        // If URL construction failed, try bare require
        return Promise.resolve(toModuleNamespace(req(asString)));
      }
    };

    // Swap all occurrences of 'import(' (awaited or not) with our shim to avoid vm dynamic import callbacks.
    const patchedCode = code.replace(/import\(/g, 'dynamicImport(');
    const fn = new Function('jsxRuntime', 'dynamicImport', `return (async () => { ${patchedCode} })();`);
    const mdxModule = await fn(jsxDevRuntime, dynamicImport);
    
    // The result has a default export which is the MDX component
    const MDXContent = mdxModule.default;
    
    // Render the component to static HTML
    const html = renderToString(
      React.createElement(MDXContent, {})
    );
    
    return html;
  } catch (err) {
    // Provide more detailed error information
    const errorMsg = `MDX compilation failed for ${filePath}: ${err.message}`;
    console.error(errorMsg);
    console.error('Full error stack:');
    console.error(err.stack);
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
