# Design System

Auto-loaded when editing any `web/` file.

## Theme

Dark-only. Near-black OLED backgrounds, electric-cyan primary, electric-violet secondary. Inspired by rig.ai's technical aesthetic. Not themed for aesthetics -- forced by use context (office monitor, app tool, terminal-native register).

## Color Palette

Strategy: **Restrained** (product register). Single electric-cyan accent, near-invisible borders.

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#1A2840` | Page background |
| `--color-bg-deep` | `#121E30` | Alternate section background |
| `--color-surface` | `#1F3050` | Cards, navbar |
| `--color-surface-elevated` | `#263860` | Modals, elevated |
| `--color-surface-highlight` | `#223558` | Hover highlight |
| `--color-border` | `rgba(12,200,240,0.13)` | Default hairline |
| `--color-border-strong` | `rgba(12,200,240,0.26)` | Active border |
| `--color-border-glow` | `rgba(12,200,240,0.48)` | Focus/glow |
| `--color-text` | `#F0F7FF` | Primary text |
| `--color-text-muted` | `rgba(180,210,235,0.84)` | Secondary text |
| `--color-text-faint` | `rgba(120,170,210,0.45)` | Placeholder/disabled |
| `--color-accent` | `#0BBDE8` | Electric cyan - primary actions, links |
| `--color-accent-hover` | `#14D0FF` | Accent hover |
| `--color-coral` | `#7E70EE` | Electric violet - badges, section labels |
| `--color-error` | `#FF7A7A` | Errors |
| `--color-success` | `#4ADE80` | Success states |
| `--color-warning` | `#FBBF24` | Warnings |
| `--color-prompt` | `#00DFFF` | Terminal $ glyph |
| `--color-amber` | `#FBBF24` | Terminal cursor |

## Typography

- **Body font**: IBM Plex Sans (400, 500, 600, 700)
- **Mono font**: IBM Plex Mono (400, 500) -- machine-generated strings only (IDs, resource names, proof text, nav eyebrows)

Scale (fixed rem, product register):

| Role | Size | Weight |
|---|---|---|
| Display | 2.25rem | 700 |
| Headline | 1.5rem | 600 |
| Title | 1.125rem | 600 |
| Body | 0.875rem | 400 |
| Label | 0.75rem | 600 -- uppercase |
| Mono | 0.875rem | 400 |

## Elevation

Three surface layers only. No shadows on cards.

1. Foundation: `--color-bg` -- page background
2. Surface: `--color-surface` -- cards, navbar
3. Elevated: `--color-surface-elevated` -- modals, popovers

Shadows only on modals (`shadow-2xl`) and toasts (`shadow-lg`).

## Components

- **Buttons**: `rounded-full`, three variants: primary (cyan fill), secondary (transparent + border), ghost (transparent)
- **Cards**: `rounded-md`, Surface background, hairline border, no shadow, hover transitions border + background
- **Inputs**: transparent/surface-tinted background, hairline border, focus ring at 2px
- **Badges**: `rounded-full`, semantic color at 15% opacity bg
- **Modals**: `rounded-xl`, Elevated background, `shadow-2xl`

## Motion

- Entry: 420ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-expo)
- State transitions: 150ms ease-out
- Reduced-motion: all animations off
