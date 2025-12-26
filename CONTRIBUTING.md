# Contributing to Linear Calendar 2

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to make something great together.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Git
- A test Obsidian vault

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/linear-calendar-2.git
   cd linear-calendar-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development mode**
   ```bash
   npm run dev
   ```
   This watches for changes and auto-copies to your test vault.

4. **Configure your test vault path**

   Edit `esbuild.config.mjs` and update `DEV_VAULT_PLUGIN_DIR` to point to your test vault.

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
```

### Linting and Formatting

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format with Prettier
npm run typecheck     # TypeScript type checking
```

## Code Standards

### TypeScript

- **Strict Mode**: All code must pass TypeScript strict mode
- **No `any`**: Avoid `any` types. Use `unknown` if type is truly unknown
- **Readonly**: Prefer `readonly` properties for immutable data
- **Explicit Returns**: Always specify return types for functions

### Documentation

- **JSDoc**: All public functions must have JSDoc comments
- **Inline Comments**: Explain *why*, not *what*
- **README Updates**: Update docs if you change public behavior

### Testing

- **Unit Tests Required**: All engines and utilities must have tests
- **80% Coverage**: Maintain minimum 80% code coverage
- **Test Naming**: Use descriptive names: `it('should parse ISO date string correctly')`

### Architecture

We follow a clean architecture pattern:

```
src/
├── core/           # Pure business logic, no dependencies
│   ├── domain/     # Data models and types
│   └── engines/    # Algorithms and calculations
├── infrastructure/ # External dependencies (Obsidian API)
├── application/    # Use cases and services
└── presentation/   # UI components
```

**Key Principles:**
- Core layer has NO external dependencies
- Dependencies flow inward only
- Infrastructure implements interfaces defined in core

## Pull Request Process

### Before Submitting

1. **Create an issue first** for significant changes
2. **Branch from `develop`**: `feature/your-feature-name`
3. **Run all checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```
4. **Update documentation** if needed

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-day event support
fix: correct timezone handling in date parser
docs: update configuration guide
refactor: extract calendar grid logic
test: add DateEngine edge case tests
chore: update dependencies
```

### PR Description

Include:
- **Summary**: What does this PR do?
- **Related Issues**: Fixes #123
- **Testing**: How did you test this?
- **Screenshots**: For UI changes

### Review Process

1. At least one approval required
2. All CI checks must pass
3. No merge conflicts
4. Squash merge preferred

## Architecture Guidelines

### Adding New Features

1. **Start with types** in `src/core/domain/types/`
2. **Implement engine** in `src/core/engines/` (if needed)
3. **Write tests** alongside the engine
4. **Add infrastructure** adapters if external dependencies needed
5. **Create UI components** in `src/presentation/`

### Core Layer Rules

- NO imports from `obsidian` module
- NO DOM manipulation
- Pure functions preferred
- 100% testable without mocks

### Error Handling

- Use explicit error types, not strings
- Never swallow errors silently
- Log warnings for recoverable issues
- Graceful degradation over crashes

## Getting Help

- **Questions**: Open a Discussion on GitHub
- **Bugs**: Open an Issue with reproduction steps
- **Ideas**: Open a Feature Request issue

## Recognition

All contributors will be credited in the README and release notes.

Thank you for contributing!
