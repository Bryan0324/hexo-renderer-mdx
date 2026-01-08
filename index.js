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
  
  // Initialize dependencies Set for tracking imported component files
  if (!data.dependencies) {
    data.dependencies = new Set();
  }
  
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
    // Collect components used so we can hydrate them client-side
    const componentsForHydration = [];
    const dynamicImport = (specifier) => {
      const asString = String(specifier);
      const req = createRequire(filePath);

      // Resolve a filesystem path for this specifier
      let fsPath;
      try {
        if (asString.startsWith('file://')) {
          fsPath = fileURLToPath(asString);
        } else {
          const resolvedUrl = new URL(asString, pathToFileURL(filePath));
          if (resolvedUrl.protocol === 'file:') {
            fsPath = fileURLToPath(resolvedUrl);
          }
        }
      } catch (e) {
        // ignore - will try bare require
      }

      // Create a placeholder component for server-side rendering
      const placeholderId = `mdx-cmp-${componentsForHydration.length + 1}`;
      const Placeholder = (props) => {
        return React.createElement('div', { 'data-mdx-component': placeholderId });
      };

      // Record mapping for hydration bundle (use filesystem path when available, otherwise the original specifier)
      componentsForHydration.push({ id: placeholderId, spec: fsPath || asString });

      // Register component file as a dependency so Hexo watches it for changes
      if (fsPath && data.dependencies) {
        data.dependencies.add(fsPath);
      }

      // Return an ES-like namespace with default export set to placeholder
      return Promise.resolve({ default: Placeholder });
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

    // If there are components to hydrate, generate a client bundle using esbuild (if available)
    let finalHtml = html;
    if (componentsForHydration.length > 0) {
      try {
        const esbuild = require('esbuild');
        const os = require('os');
        const tmpdir = os.tmpdir();
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(filePath).digest('hex').slice(0,8);
        const outName = `mdx-hydrate-${hash}.js`;
        const outDir = require('path').join(process.cwd(), 'source', 'assets');
        const entryPath = require('path').join(process.cwd(), '.hexo-mdx-entry', `mdx-entry-${hash}.mjs`);

        const imports = componentsForHydration.map((c, i) => {
          // Convert absolute path to relative path from entry directory
          let importPath = c.spec;
          if (require('path').isAbsolute(importPath)) {
            importPath = require('path').relative(require('path').dirname(entryPath), importPath);
          }
          // Normalize slashes for JS import
          importPath = importPath.replace(/\\/g, '/');
          // Ensure relative imports start with ./ or ../
          if (!importPath.startsWith('.')) {
            importPath = './' + importPath;
          }
          return `import C${i} from ${JSON.stringify(importPath)};`;
        }).join('\n');

        const mapping = componentsForHydration.map((c, i) => `  '${c.id}': C${i}`).join(',\n');

        const entrySource = `import React from 'react';\nimport { hydrateRoot } from 'react-dom/client';\n\n// Make React available globally for imported components\nwindow.React = React;\n\n${imports}\n\nconst mapping = {\n${mapping}\n};\n\nObject.keys(mapping).forEach(id => {\n  const Comp = mapping[id];\n  const el = document.querySelector('[data-mdx-component="'+id+'"]');\n  if (el) {\n    hydrateRoot(el, React.createElement(Comp, {}));\n  }\n});\n`;

        require('fs').mkdirSync(require('path').dirname(entryPath), { recursive: true });
        require('fs').writeFileSync(entryPath, entrySource, 'utf8');
        require('fs').mkdirSync(outDir, { recursive: true });

        esbuild.buildSync({
          entryPoints: [entryPath],
          bundle: true,
          format: 'esm',
          outfile: require('path').join(outDir, outName),
          platform: 'browser',
          jsx: 'transform',
          jsxFactory: 'React.createElement',
          jsxFragment: 'React.Fragment',
          minify: false,
          absWorkingDir: process.cwd(),
          loader: { '.jsx': 'jsx', '.js': 'js', '.mjs': 'js' }
        });

        finalHtml = `<div id="mdx-root-${hash}">${html}</div><script type="module" src="/assets/${outName}"></script>`;
      } catch (err) {
        console.error('MDX hydration bundle failed:', err.message);
      }
    }
    
    return finalHtml;
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
const path = require('path');
const componentDependencies = new Map(); // Map of component path -> Set of MDX files that import it

// Wrap renderer to track component dependencies
const originalMdxRenderer = mdxRenderer;
async function mdxRendererWithTracking(data) {
  const result = await originalMdxRenderer(data);
  
  // Track which components this MDX file depends on
  if (data.dependencies && data.dependencies.size > 0) {
    data.dependencies.forEach(componentPath => {
      if (!componentDependencies.has(componentPath)) {
        componentDependencies.set(componentPath, new Set());
      }
      componentDependencies.get(componentPath).add(data.path);
    });
  }
  
  return result;
}

hexo.extend.renderer.register('mdx', 'html', mdxRendererWithTracking, {
  disableNunjucks: true
});

/**
 * Watch component files and trigger full site regeneration when they change
 */
let mdxComponentWatcher = null;

hexo.extend.filter.register('after_init', function() {
  // Set up file watcher for components after Hexo initializes
  const sourceDir = path.join(hexo.source_dir, 'components');
  
  try {
    // Use chokidar to watch the components directory
    const chokidar = require('chokidar');
    
    if (mdxComponentWatcher) {
      mdxComponentWatcher.close();
    }
    
    mdxComponentWatcher = chokidar.watch(sourceDir, {
      ignored: /node_modules|\.git/,
      persistent: true,
      delay: 500,
      usePolling: true  // Enable polling for better reliability
    });
    
    mdxComponentWatcher.on('change', (changedPath) => {
      console.log(`\nINFO  Component file changed: ${changedPath}`);
      console.log(`INFO  Clearing caches and triggering regeneration...`);
      
      // Clear the require cache for all components and Babel
      Object.keys(require.cache).forEach(key => {
        if (key.includes(sourceDir) || key.includes('source/components') || key.includes('.hexo-mdx-entry')) {
          delete require.cache[key];
        }
      });
      
      // Delete the compiled entry directory to force recreation
      const fs = require('fs');
      const mdxEntryDir = path.join(hexo.base_dir, '.hexo-mdx-entry');
      if (fs.existsSync(mdxEntryDir)) {
        try {
          fs.rmSync(mdxEntryDir, { recursive: true });
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      
      // Invalidate Hexo's locals cache
      if (hexo.locals) {
        hexo.locals.invalidate();
      }
      
      // Use hexo clean then hexo generate to force complete regeneration
      process.nextTick(() => {
        hexo.call('clean').then(() => {
          return hexo.call('generate', {watch: false});
        }).then(() => {
          console.log('INFO  ✓ Regeneration complete - refresh your browser to see changes');
        }).catch(err => {
          console.warn('Regeneration error:', err.message);
        });
      });
    });
    
    console.log('INFO  Component file watcher initialized');
  } catch (err) {
    console.warn('Component file watcher setup warning:', err.message);
  }
});