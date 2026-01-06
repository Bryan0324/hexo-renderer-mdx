# hexo-renderer-mdx

A [Hexo](https://hexo.io/) renderer plugin for [MDX](https://mdxjs.com/) - Markdown with JSX support. This plugin allows you to write Hexo posts and pages using MDX, enabling you to embed React components directly in your markdown content.

## Features

- 🚀 Full MDX support with JSX syntax
- ⚛️ React component integration
- 📝 Markdown compatibility
- 🎨 Custom component support
- 🔥 Fast compilation with @mdx-js/mdx

## Installation

```bash
npm install hexo-renderer-mdx --save
```

or with yarn:

```bash
yarn add hexo-renderer-mdx
```

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

## How It Works

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
- `@mdx-js/react` - React integration
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
npm install react react-dom @mdx-js/mdx @mdx-js/react --save
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related

- [Hexo](https://hexo.io/)
- [MDX](https://mdxjs.com/)
- [React](https://reactjs.org/)