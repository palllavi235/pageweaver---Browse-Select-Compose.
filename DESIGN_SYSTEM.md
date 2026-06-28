# PageWeaver Design System

## Identity

The PageWeaver mark combines a folded sheet with two interlacing paper ribbons. The alternating leather and antique-brass bands form a quiet “W” while communicating composition without relying on a generic PDF badge. Use the full wordmark in navigation and the mark alone for app icons, compact surfaces, and loading states.

## Foundation

| Token | Value | Purpose |
| --- | --- | --- |
| Paper | `#F6F1E8` | App background |
| Surface | `#FFFCF6` | Cards and document sheets |
| Leather | `#775035` | Primary action and identity |
| Antique brass | `#A98245` | Selection and restrained emphasis |
| Ink | `#2B2824` | Primary text |
| Muted | `#756E65` | Secondary text |
| Binding | `#D8C9B0` | Borders and separators |
| Sage | `#617D61` | Success |
| Oxide | `#A9584C` | Error and destructive actions |

Playfair Display provides editorial character for headings. Inter handles controls and dense workspace information. Headings use balanced wrapping and tight tracking; body text uses generous line-height and never relies on color alone for meaning.

## Shape and elevation

- Controls use a 12px radius.
- Cards and panels use a 16px radius.
- Large marketing frames use 28–32px only when they establish a distinct canvas.
- Shadows use low-opacity brown-black layers, never glow effects.
- Borders remain visible so surfaces retain the tactile quality of layered stationery.

## Spacing

Page gutters scale from 16px on small phones to 32px on desktop. Component spacing follows a 4px base scale, with 12px for related control groups, 20–24px for card interiors, and 32–40px between workspace sections.

## Motion

Motion preserves context: drawers use a damped spring, cards lift by 2–3px, dialogs scale by 3%, and the logo’s paper ribbons shift gently during loading. Reduced-motion preferences collapse animation durations globally.

## Components

The reusable implementation lives in `src/components/ui`. It includes buttons, icon buttons, cards, dialogs/modals, toasts, inputs, search, loader, skeleton, tooltip, dropdown, badge, breadcrumb, tabs, empty/error states, and progress. Product-level primitives—brand, sidebar, topbar, document previews, composer panel, and illustrations—live in `src/components`.

## Accessibility

Interactive controls expose accessible names, keyboard focus uses an antique-brass ring, contrast is maintained against both paper surfaces, and motion honors `prefers-reduced-motion`.
