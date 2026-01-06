# Examples

This directory contains example MDX files demonstrating various features of the hexo-renderer-mdx plugin.

## Files

### simple-post.mdx
A basic example showing:
- Standard Markdown formatting
- Code blocks
- Simple JSX elements with inline styles
- Custom buttons and alerts

### component-rich.mdx
An advanced example demonstrating:
- Custom React component definitions
- InfoBox component with multiple types
- Text highlighting component
- Gallery component with grid layout
- Mixing Markdown inside JSX components

## How to Use

1. Install hexo-renderer-mdx in your Hexo project:
   ```bash
   npm install hexo-renderer-mdx --save
   ```

2. Copy any of these example files to your `source/_posts` directory

3. Run `hexo generate` to build your site

4. The MDX files will be rendered to HTML with all components and styles applied

## Tips

- Components defined with `export` in MDX files are scoped to that file
- You can use any valid JSX expression
- Styles are inlined and will be rendered as HTML style attributes
- Remember that this is server-side rendering - components won't be interactive in the final output

## Learn More

- [MDX Documentation](https://mdxjs.com/)
- [Hexo Documentation](https://hexo.io/)
- [React Documentation](https://reactjs.org/)
