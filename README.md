# hexo-renderer-mdx

A [Hexo](https://hexo.io/) renderer plugin for [MDX](https://mdxjs.com/) - Markdown with JSX support. This plugin allows you to write Hexo posts and pages using MDX, enabling you to embed React components directly in your markdown content.

## Features

- 🚀 Full MDX support with JSX syntax
- ⚛️ React component integration
- 📝 Markdown compatibility
- 🎨 Custom component support
- � ES6 import statements for external packages
- �� Fast compilation with @mdx-js/mdx

## Installation

```bash
npm install hexo-renderer-mdx --save
```

or with yarn:

```bash
yarn add hexo-renderer-mdx
```

## How to Use

### Quick Start

1. **Install the plugin** in your Hexo blog directory:

   ```bash
   npm install hexo-renderer-mdx --save
   ```

2. **Create your first MDX post** in `source/_posts/my-first-mdx-post.mdx`:

   ```mdx
   ---
   title: My First MDX Post
   date: 2026-01-06
   tags: [hexo, mdx]
   ---

   # Hello from MDX!

   This is regular markdown **with bold text**.

   <div style={{ 
     padding: '20px', 
     backgroundColor: '#e3f2fd',
     borderRadius: '8px',
     marginTop: '20px'
   }}>
     🎉 This is a styled JSX element!
   </div>
   ```

3. **Generate your site**:

   ```bash
   hexo generate
   ```

4. **Preview locally**:

   ```bash
   hexo server
   ```

5. **View your post** at `http://localhost:4000`

That's it! The plugin automatically processes all `.mdx` files in your Hexo blog.

### Step-by-Step Guide

#### 1. Setting Up a New Hexo Blog (Optional)

If you don't have a Hexo blog yet:

```bash
npm install -g hexo-cli
hexo init my-blog
cd my-blog
npm install
```

#### 2. Installing the Plugin

In your Hexo blog directory:

```bash
npm install hexo-renderer-mdx --save
```

No additional configuration is needed - the plugin registers automatically!

#### 3. Creating MDX Files

MDX files work just like regular Markdown files, but with JSX support. Create files in:
- `source/_posts/` for blog posts
- `source/` for pages

**File naming**: Use `.mdx` extension (e.g., `my-post.mdx`)

**Front matter**: Same as regular Hexo posts:

```mdx
---
title: Post Title
date: 2026-01-06
categories:
  - Technology
tags:
  - hexo
  - mdx
---

Your content here...
```

#### 4. Using MDX Features

**Standard Markdown** - All markdown features work:

```mdx
# Heading 1
## Heading 2

**Bold**, *italic*, ~~strikethrough~~

- List item 1
- List item 2

[Link text](https://example.com)
```

**Inline JSX** - Add HTML/JSX elements anywhere:

```mdx
<div className="custom-class" style={{ color: 'blue' }}>
  Custom styled content
</div>
```

**Custom Components** - Define and use React components:

```mdx
export const Alert = ({ children, type = 'info' }) => (
  <div style={{ 
    padding: '15px',
    backgroundColor: type === 'warning' ? '#fff3cd' : '#d1ecf1',
    borderRadius: '5px',
    margin: '20px 0'
  }}>
    {children}
  </div>
);

<Alert type="warning">
  This is a custom alert component!
</Alert>
```

**Dynamic Content** - Use JavaScript expressions:

```mdx
<div>
  {['React', 'Vue', 'Angular'].map(framework => (
    <p key={framework}>I ❤️ {framework}</p>
  ))}
</div>
```

**Import Statements** - Import external modules and packages:

```mdx
import React from 'react';
import { format } from 'date-fns';

<div>
  Today's date: {format(new Date(), 'MMMM dd, yyyy')}
</div>
```

You can also import local components or utilities:

```mdx
import MyCustomComponent from './components/MyCustomComponent';
import { helper } from './utils/helpers';

<MyCustomComponent data={helper()} />
```

**Note**: Make sure any packages you import are installed in your Hexo project:
```bash
npm install date-fns --save
```

#### 5. Building and Deploying

Build your site as usual:

```bash
# Generate static files
hexo generate

# Deploy (if configured)
hexo deploy
```

The MDX files are compiled to static HTML - no JavaScript runtime needed on your site!

## Usage

After installation, you can create `.mdx` files in your `source/_posts` or `source` directory.

### Basic Example

Create a file `source/_posts/hello-mdx.mdx`:

```mdx
---
title: Hello MDX
date: 2026-01-06
tags:
  - mdx
  - react
---

# Hello MDX!

This is a regular markdown paragraph.

You can use JSX directly:

<div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
  <h2>Custom Component</h2>
  <p>This is rendered using JSX!</p>
</div>

And back to markdown...

## Features

- List item 1
- List item 2
- List item 3
```

### Advanced Example

You can use more complex JSX:

```mdx
---
title: Advanced MDX
---

export const Button = ({ children, color = 'blue' }) => (
  <button style={{ 
    backgroundColor: color, 
    color: 'white', 
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }}>
    {children}
  </button>
);

# Advanced MDX Example

Here's a custom button component:

<Button color="red">Click Me!</Button>

You can use any valid JSX expression:

<div>
  {['apple', 'banana', 'cherry'].map(fruit => (
    <p key={fruit}>I love {fruit}s!</p>
  ))}
</div>
```

## Configuration

The plugin works out of the box with no configuration required. However, you can customize MDX compilation options if needed.

### Advanced Configuration

If you need to customize the MDX compiler options, you can create a `hexo-renderer-mdx` configuration in your Hexo `_config.yml`:

```yaml
# _config.yml
mdx:
  # Enable development mode for better error messages
  development: false
```

Note: The current version uses sensible defaults optimized for static site generation.

The plugin:
1. Compiles MDX files to JavaScript functions
2. Executes them with a React runtime
3. Renders the result to static HTML
4. Passes the HTML to Hexo for page generation

## Requirements

- Node.js >= 14.0.0
- Hexo >= 5.0.0

## Dependencies

This plugin uses:
- `@mdx-js/mdx` - MDX compiler
- `react` & `react-dom` - React runtime for server-side rendering

## Notes

- MDX files are compiled to static HTML at build time
- Interactive React components will not be interactive in the final output (server-side rendering only)
- For interactive components, consider using a different approach or client-side hydration

## Troubleshooting

### MDX Compilation Errors

If you encounter compilation errors, check:
- Your JSX syntax is valid
- All tags are properly closed
- You're not using unsupported JSX features

### Missing Dependencies

Make sure all peer dependencies are installed:

```bash
npm install react react-dom @mdx-js/mdx --save
```

## Publishing

### For Maintainers

This package uses automated publishing to npm via GitHub Actions with **Trusted Publishing** (OIDC).

**To publish a new version:**

1. Update the version in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. Push the changes and tags:
   ```bash
   git push && git push --tags
   ```

3. Create a new release on GitHub:
   - Go to the repository's "Releases" page
   - Click "Create a new release"
   - Select the tag you just created
   - Add release notes
   - Click "Publish release"

4. The GitHub Action will automatically:
   - Run tests
   - Publish to npm with provenance using Trusted Publishing
   - Make the package publicly available

**First-time setup:**

Before publishing, you need to configure Trusted Publishing on npm:

1. Go to https://www.npmjs.com/package/hexo-renderer-mdx/access
2. Click "Publishing" → "Trusted Publishers"
3. Add a new trusted publisher with:
   - **Provider**: GitHub Actions
   - **Repository owner**: Bryan0324
   - **Repository name**: hexo-renderer-mdx
   - **Workflow file**: `publish.yml`
   - **Environment name**: (leave empty)

No npm tokens required! Trusted Publishing uses OpenID Connect (OIDC) for secure authentication.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed publishing instructions.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT

## Related

- [Hexo](https://hexo.io/)
- [MDX](https://mdxjs.com/)
- [React](https://reactjs.org/)