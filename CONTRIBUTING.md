# Contributing to hexo-renderer-mdx

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hexo-renderer-mdx.git
   cd hexo-renderer-mdx
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Running Tests

```bash
npm test
```

This runs both basic and advanced test suites that validate:
- MDX compilation
- Markdown rendering
- JSX element rendering
- Custom components
- Dynamic content
- Front matter handling

### Adding New Features

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to `index.js`

3. Add tests if applicable:
   - Add test cases to `test/` directory
   - Update `test.js` or `test-advanced.js` as needed

4. Run tests to ensure nothing is broken:
   ```bash
   npm test
   ```

5. Commit your changes:
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Open a Pull Request

## Code Style

- Use single quotes for strings
- Use 2 spaces for indentation
- Add JSDoc comments for functions
- Follow existing code patterns

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Ensure all tests pass
- Add tests for new features
- Update README.md if adding user-facing changes

## Reporting Issues

When reporting issues, please include:
- Hexo version
- Node.js version
- hexo-renderer-mdx version
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## Publishing (Maintainers Only)

### Setup - Trusted Publishing

This package uses **Trusted Publishing** (OIDC) for secure, token-free publishing to npm.

1. **Create an npm account** at https://www.npmjs.com if you don't have one

2. **Configure Trusted Publishing on npm**:
   - Publish the package manually first time: `npm publish --access public`
   - Go to https://www.npmjs.com/package/hexo-renderer-mdx/access
   - Navigate to "Publishing" → "Trusted Publishers"
   - Click "Add trusted publisher"
   - Fill in the details:
     - **Provider**: GitHub Actions
     - **Repository owner**: Bryan0324
     - **Repository name**: hexo-renderer-mdx
     - **Workflow file**: publish.yml
     - **Environment name**: (leave empty)
   - Click "Add"

No npm tokens needed! The workflow uses OpenID Connect (OIDC) to authenticate securely.

### Publishing a New Version

1. **Update version** in `package.json`:
   ```bash
   npm version patch  # for bug fixes (1.0.0 → 1.0.1)
   npm version minor  # for new features (1.0.0 → 1.1.0)
   npm version major  # for breaking changes (1.0.0 → 2.0.0)
   ```

2. **Push changes and tags**:
   ```bash
   git push
   git push --tags
   ```

3. **Create a GitHub Release**:
   - Go to https://github.com/Bryan0324/hexo-renderer-mdx/releases
   - Click "Draft a new release"
   - Choose the tag you just created
   - Add release title (e.g., "v1.0.1")
   - Add release notes describing changes
   - Click "Publish release"

4. **GitHub Action will automatically**:
   - Checkout the code
   - Install dependencies
   - Run tests
   - Publish to npm with provenance using Trusted Publishing
   - Make the package publicly available

5. **Verify publication**:
   - Check https://www.npmjs.com/package/hexo-renderer-mdx
   - Verify the new version is listed
   - Check that provenance is displayed

### Manual Publishing (If Needed)

If you need to publish manually:

```bash
# Login to npm
npm login

# Publish
npm publish --access public
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
