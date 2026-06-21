# PlacementOS Onboarding Design System

## Product objective

The onboarding experience introduces PlacementOS as a unified
placement-preparation operating system rather than a collection
of independent trackers.

Primary conversion goals:

1. Create a free account
2. Sign in to an existing account
3. Explore features and privacy controls
4. Understand the weighted readiness model

## Visual direction

- Dark professional SaaS interface
- Indigo primary brand
- Low-noise gradients and glass surfaces
- Data-driven product previews
- Minimal decorative assets
- Strong contrast and readable hierarchy

## Core palette

| Token | Value | Usage |
|---|---|---|
| Background | `#050816` | Page background |
| Surface | `#0B1020` | Cards and panels |
| Surface elevated | `#0E1427` | Hover/elevated state |
| Primary | `#6366F1` | CTA and active controls |
| Primary light | `#A5B4FC` | Supporting highlights |
| Success | `#34D399` | Positive progress |
| Text primary | `#FFFFFF` | Headings and primary copy |
| Text secondary | `#94A3B8` | Descriptions |
| Text muted | `#64748B` | Metadata |

## Typography

- Font family: existing application sans-serif stack
- Hero: 64–72px desktop, 40–48px mobile
- Section heading: 32–40px
- Card heading: 16–18px
- Body: 14–18px
- Metadata: 11–12px

## Radius

- Small controls: 12px
- Cards: 16px
- Hero/product panels: 24–28px
- Pills: full radius

## Spacing

Use an 8px base spacing system:

- 8px: icon and label spacing
- 16px: card internal spacing
- 24px: standard card padding
- 32px: content group spacing
- 64–96px: section spacing

## Interaction

- Buttons rise by 2px on hover
- Feature cards rise by 4px on hover
- Progress values animate only through CSS
- Section reveal uses IntersectionObserver
- All animation respects `prefers-reduced-motion`

## Accessibility

- Semantic header, navigation, main, section, footer
- Skip-to-content link
- Visible focus states
- Minimum 4.5:1 body-text contrast
- Touch targets at least 40px
- Mobile menu exposes `aria-expanded`
- Decorative icons use `aria-hidden`
- Reduced-motion fallback included

## Performance strategy

- No external hero image
- No animation library
- CSS-only visual effects
- Route-level lazy loading
- Minimal landing-page dependencies
- No blocking network requests on onboarding
- Product preview rendered with HTML/CSS

## Responsive behaviour

- Mobile: single-column hero and cards
- Tablet: two-column feature grid
- Desktop: split hero and three-column feature grid
- Navigation collapses below 768px

## Security boundaries

The onboarding page does not process credentials or sensitive
data. Authentication remains delegated to the existing protected
REST API and auth store.

Never expose:

- JWT secrets
- Refresh-token secrets
- API private keys
- Database credentials
- Third-party service secrets