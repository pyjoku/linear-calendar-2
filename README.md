# Linear Calendar 2

A professional linear calendar view for Obsidian that displays all 365 days of the year with your notes.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0+-purple.svg)

## Features

- **Linear Year View**: See all 365 days at a glance in a compact, linear format
- **Note Integration**: Display notes based on date properties or filename patterns
- **Multi-Day Events**: Visual bars spanning multiple days for events with start and end dates
- **Daily Notes**: Click any day number to open or create the corresponding daily note
- **Timezone-Safe**: Correct date handling without UTC offset issues
- **Theme Compatible**: Uses CSS variables for seamless theme integration
- **Accessible**: Keyboard navigation and screen reader support

## Installation

### From Community Plugins (Recommended)

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Linear Calendar 2"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/pyjoku/linear-calendar-2/releases)
2. Extract the files to your vault's `.obsidian/plugins/linear-calendar-2/` folder
3. Reload Obsidian
4. Enable "Linear Calendar 2" in Community Plugins settings

## Usage

### Opening the Calendar

- Click the calendar icon in the left ribbon
- Or use the command palette: "Open Linear Calendar"

### Date Extraction

The plugin extracts dates from your notes using:

1. **Frontmatter Properties**: Configure which properties contain dates
   ```yaml
   ---
   date: 2025-01-15
   date_end: 2025-01-20
   ---
   ```

2. **Filename Patterns**: Automatically detects dates in filenames
   - `2025-01-15 Meeting Notes.md` → Single day
   - `2025-01-15 - 2025-01-20 Conference.md` → Multi-day

### Configuration

Access settings via Settings → Linear Calendar 2:

| Setting | Description |
|---------|-------------|
| Calendar Width | Fit to screen or scrollable with wider cells |
| Date Properties | Which frontmatter properties to check for dates |
| Date Priority | Prefer property or filename when both exist |
| Daily Note Format | Format for daily note filenames (YYYY-MM-DD) |

## Development

### Setup

```bash
git clone https://github.com/pyjoku/linear-calendar-2.git
cd linear-calendar-2
npm install
npm run dev
```

### Testing

```bash
npm test           # Run tests once
npm run test:watch # Watch mode
npm run test:coverage # With coverage report
```

### Building

```bash
npm run build      # Production build
```

## Architecture

This plugin follows a clean architecture pattern:

```
src/
├── core/           # Framework-agnostic business logic
│   ├── domain/     # Models and types
│   └── engines/    # Date parsing, calendar calculations
├── infrastructure/ # Obsidian-specific implementations
├── application/    # Services and orchestration
└── presentation/   # UI components
```

See [Architecture Documentation](docs/architecture.md) for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## License

MIT - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by the original Linear Calendar plugin
- Built with [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
