# Screenshots for Blog

Add the following screenshots to this folder:

## Required Screenshots

| Filename | Description | Dimensions |
|----------|-------------|------------|
| `dashboard-overview.png` | Main dashboard with all 4 tabs visible | 1200x800 |
| `streaming-response.gif` | GIF showing AI text appearing progressively | 800x500 |
| `resume-analyzer.png` | Resume upload zone + analysis results | 1200x800 |
| `career-explorer.png` | Quick explore cards + streaming result | 1200x800 |
| `saved-paths.png` | List of saved career paths | 1200x600 |
| `ai-assistant.png` | Chat interface with conversation | 1200x800 |
| `error-recovery.png` | Error state with retry button | 800x400 |
| `mobile-responsive.png` | Mobile viewport (iPhone 14 size) | 390x844 |
| `theme-comparison.png` | Side-by-side dark/light mode | 1400x700 |

## How to Capture

### Static Screenshots
```bash
# Use browser DevTools → Device toolbar → Responsive
# Set dimensions, then Cmd+Shift+P → "Capture full size screenshot"
```

### GIF Recording
```bash
# macOS: Use Kap (free) or CleanShot X
# Linux: Use Peek or Kazam
# Windows: Use ScreenToGif

# Recommended settings:
# - 15 FPS
# - Optimize for web (< 2MB)
# - Crop to content area only
```

### Tips
1. Use incognito mode (no extensions)
2. Clear any test data first
3. Use realistic sample content
4. Ensure dark theme is active for consistency
5. Hide any personal email in auth screens

## Image Optimization

Before committing, optimize images:

```bash
# Install: npm install -g imageoptim-cli
imageoptim docs/screenshots/*.png

# Or use squoosh.app for manual optimization
# Target: < 200kb per PNG, < 2MB for GIFs
```
