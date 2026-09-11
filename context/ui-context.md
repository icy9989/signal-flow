# UI Context

## Theme

SignalFlow uses a **dark-only visual system**.

There is no light mode in the initial product.

The design language is a modern, premium analytics SaaS workspace with:

* Near-black backgrounds
* Layered dark surfaces
* Green as the primary brand and interaction color
* Colorful charts and data visualization
* Subtle borders
* Soft shadows
* Strong typography
* Compact but readable dashboard layouts
* Minimal glow
* Minimal gradients
* Clear hierarchy between navigation, metrics, insights, and data

The interface should feel modern, technical, and polished.

The product should not look like a generic AI application.

Avoid excessive:

* Purple gradients
* Neon glow
* Glassmorphism
* Huge rounded cards
* Decorative AI effects
* Overly saturated backgrounds

Green should define the product identity.

Other colors should mainly communicate data, status, categories, sentiment, trends, and charts.

---

# Visual Direction

The overall visual hierarchy should resemble a premium B2B analytics product.

Think:

```text
Dark workspace
+
Green identity
+
Colorful analytics
+
Clean typography
+
Dense but readable information
+
Subtle motion
```

The dashboard should feel visually rich without becoming visually noisy.

---

# Colors

All reusable colors must be defined through CSS custom properties or design tokens.

Do not scatter hardcoded hex values throughout components.

## Core Colors

| Role               | CSS Variable       | Value     |
| ------------------ | ------------------ | --------- |
| Page background    | `--bg-base`        | `#090D0B` |
| Sidebar background | `--bg-sidebar`     | `#0B100D` |
| Primary surface    | `--bg-surface`     | `#101612` |
| Elevated surface   | `--bg-elevated`    | `#141C17` |
| Hover surface      | `--bg-hover`       | `#19231D` |
| Active surface     | `--bg-active`      | `#1D2A22` |
| Primary text       | `--text-primary`   | `#F2F7F3` |
| Secondary text     | `--text-secondary` | `#A8B5AC` |
| Muted text         | `--text-muted`     | `#6F7D74` |
| Disabled text      | `--text-disabled`  | `#4B5650` |
| Default border     | `--border-default` | `#202A24` |
| Strong border      | `--border-strong`  | `#2C3931` |

---

# Primary Green

Green is the main brand color.

| Role           | CSS Variable              | Value                     |
| -------------- | ------------------------- | ------------------------- |
| Primary accent | `--accent-primary`        | `#22C55E`                 |
| Primary hover  | `--accent-primary-hover`  | `#16A34A`                 |
| Primary soft   | `--accent-primary-soft`   | `rgba(34, 197, 94, 0.12)` |
| Primary border | `--accent-primary-border` | `rgba(34, 197, 94, 0.30)` |
| Bright green   | `--accent-bright`         | `#4ADE80`                 |
| Deep green     | `--accent-deep`           | `#15803D`                 |

Use primary green for:

* Main CTA buttons
* Active navigation
* Selected tabs
* Important interactive states
* Positive brand highlights
* Progress indicators
* Focus states
* Key dashboard emphasis

Do not make every element green.

Green must remain visually important.

---

# Semantic Colors

Use semantic colors consistently.

| Role    | CSS Variable      | Value     |
| ------- | ----------------- | --------- |
| Success | `--state-success` | `#22C55E` |
| Warning | `--state-warning` | `#F59E0B` |
| Error   | `--state-error`   | `#EF4444` |
| Info    | `--state-info`    | `#3B82F6` |
| Purple  | `--state-purple`  | `#A855F7` |
| Cyan    | `--state-cyan`    | `#06B6D4` |
| Pink    | `--state-pink`    | `#EC4899` |

These colors should appear mainly in:

* Charts
* Trend indicators
* Sentiment
* Status badges
* Topic categories
* Alerts
* Analytics cards

---

# Dashboard Chart Palette

Dashboards may use a broader color palette than the rest of the UI.

Use colors intentionally rather than randomly.

Recommended chart palette:

```css
--chart-green: #22C55E;
--chart-emerald: #10B981;
--chart-blue: #3B82F6;
--chart-cyan: #06B6D4;
--chart-purple: #8B5CF6;
--chart-pink: #EC4899;
--chart-orange: #F97316;
--chart-yellow: #EAB308;
--chart-red: #EF4444;
```

Charts should remain readable against dark surfaces.

Avoid pastel colors with insufficient contrast.

---

# Sentiment Colors

Use consistent sentiment colors throughout the product.

```css
--sentiment-positive: #22C55E;
--sentiment-neutral: #64748B;
--sentiment-negative: #EF4444;
```

Examples:

```text
Positive  → Green
Neutral   → Slate
Negative  → Red
```

Do not use different sentiment colors on different pages.

---

# Severity Colors

```css
--severity-low: #3B82F6;
--severity-medium: #F59E0B;
--severity-high: #EF4444;
--severity-critical: #DC2626;
```

Severity should use:

* Small badges
* Dots
* Icons
* Thin borders
* Small highlights

Avoid filling large areas with bright warning colors.

---

# Topic Colors

Topics may use colorful identity markers.

Example:

```text
Checkout       → Green
Authentication → Purple
Performance    → Blue
Search         → Cyan
Billing        → Orange
Bug            → Red
Feature        → Pink
```

Topic colors help users scan dense analytics quickly.

They should not override the primary green brand identity.

---

# Typography

Use modern, clean typography.

Recommended fonts:

| Role                    | Font       | Variable      |
| ----------------------- | ---------- | ------------- |
| Primary UI              | Geist Sans | `--font-sans` |
| Code / technical values | Geist Mono | `--font-mono` |

Alternative:

```text
Inter
+
Geist Mono
```

Do not use decorative display fonts inside the application dashboard.

---

# Typography Scale

Recommended hierarchy:

```text
Page title
text-2xl / text-3xl
font-semibold

Section title
text-lg
font-semibold

Card title
text-sm
font-medium

Metric value
text-2xl / text-3xl
font-semibold

Body
text-sm

Secondary
text-sm
text-muted

Metadata
text-xs
text-muted
```

Large dashboard numbers should be visually strong without becoming oversized.

---

# Font Weight

Use primarily:

```text
400 — body text
500 — labels / navigation
600 — titles / important values
```

Use `700` sparingly.

Too much bold text weakens visual hierarchy.

---

# Border Radius

The interface should feel modern but not excessively rounded.

| Context          | Class                          |
| ---------------- | ------------------------------ |
| Small controls   | `rounded-md`                   |
| Inputs           | `rounded-md`                   |
| Buttons          | `rounded-md`                   |
| Badges           | `rounded-full` or `rounded-md` |
| Cards            | `rounded-xl`                   |
| Dashboard panels | `rounded-xl`                   |
| Dropdowns        | `rounded-lg`                   |
| Modals           | `rounded-xl`                   |

Avoid extremely large radius values on normal dashboard cards.

---

# Borders

Use thin borders to separate surfaces.

Standard:

```text
border
border-border
```

Borders should generally be more visible than shadows.

Use green borders only for:

* Selected states
* Focus
* Active cards
* Important AI insights
* Key status states

Do not outline every card in green.

---

# Shadows

Use shadows sparingly.

Dark dashboards should rely mainly on:

* Layered surfaces
* Borders
* Spacing

rather than heavy shadows.

Use subtle shadows for:

* Dropdowns
* Menus
* Modals
* Floating panels

Avoid glowing shadows except for rare high-priority states.

---

# Component Library

Use:

```text
shadcn/ui
+
Tailwind CSS
```

Components live in:

```text
components/ui/
```

Use shadcn/ui primitives instead of rebuilding standard accessible components from scratch.

Examples:

```text
Button
Card
Dialog
DropdownMenu
Command
Popover
Select
Tabs
Tooltip
Table
Badge
Progress
Skeleton
Sheet
Avatar
```

Product components should compose these primitives.

---

# Dashboard Components

Recommended reusable components:

```text
MetricCard
TrendBadge
InsightCard
TopicCard
SentimentBadge
SeverityBadge
ChartCard
ChartTooltip
FeedbackTable
FeedbackFilters
DateRangePicker
PageHeader
EmptyState
LoadingState
SectionHeader
```

Keep visual behavior consistent across pages.

---

# Main Application Layout

The application should use a classic SaaS dashboard structure:

```text
┌───────────────────────────────────────────────────────────────┐
│ Topbar                                                        │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│ Sidebar       │ Main Dashboard                                │
│               │                                               │
│ Overview      │                                               │
│ Feedback      │                                               │
│ Topics        │                                               │
│ Insights      │                                               │
│ Analytics     │                                               │
│               │                                               │
│ Integrations  │                                               │
│ Team          │                                               │
│ Billing       │                                               │
│ Settings      │                                               │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

---

# Sidebar

Desktop sidebar:

```text
width: 240px–260px
fixed or sticky
full viewport height
```

Visual style:

* Darker than content surfaces
* Right border separator
* Compact navigation
* Small icons
* Strong active-state treatment

Active navigation item:

```text
dark green-tinted background
green icon
bright primary text
subtle green border or indicator
```

Example:

```text
▣ SignalFlow

● Overview
  Feedback
  Topics
  Insights
  Analytics

────────────

  Integrations
  Team
  Billing
  Settings
```

The sidebar should not be excessively wide.

---

# Mobile Navigation

On mobile:

* Hide desktop sidebar
* Use Sheet / drawer navigation
* Keep top navigation compact
* Preserve access to all primary routes

Do not simply compress the desktop sidebar into unusable narrow space.

---

# Topbar

The topbar should contain:

```text
Breadcrumb / page context
Search
Notifications
Organization switcher
User avatar
```

Use a subtle bottom border.

Avoid large header heights.

Recommended:

```text
56px–64px
```

---

# Dashboard Layout

The dashboard should use a responsive grid.

Desktop:

```text
12-column grid
```

Examples:

```text
4 metric cards
→ 3 columns each

Large chart
→ 8 columns

Emerging issue panel
→ 4 columns
```

Tablet:

```text
2-column layouts
```

Mobile:

```text
1-column stack
```

---

# Dashboard Color Strategy

The dashboard should be colorful through **data**, not through large colorful backgrounds.

Good:

```text
Dark card
Green trend indicator
Blue chart
Purple category marker
Orange warning badge
Red negative indicator
```

Avoid:

```text
Bright purple card
Bright orange card
Bright blue card
Bright green card
```

for every metric.

Cards remain dark and stable.

Data creates color.

---

# Metric Cards

Metric cards should contain:

```text
Label
Primary value
Trend
Optional small sparkline
Optional icon
```

Example:

```text
Total Feedback

12,481

↑ 12.4%

▁▂▃▄▅▆█
```

Use green for positive movement only when positive movement is actually desirable.

For example, increasing negative feedback is not positive just because the number increased.

Trend color must reflect meaning, not mathematical direction alone.

---

# Charts

Charts are one of the main visual areas where color is encouraged.

Use:

* Smooth lines
* Subtle area fills
* Minimal grid lines
* Clear tooltips
* Dark chart backgrounds
* High-contrast labels

Avoid:

* Thick borders
* Excessive axis labels
* Heavy chart grid
* 3D charts
* Decorative effects

---

# Line Charts

Recommended:

```text
2px line
soft area gradient
minimal points
points appear on hover
```

Primary analytics line:

```text
Green
```

Comparison lines may use:

```text
Blue
Purple
Cyan
Orange
```

---

# Bar Charts

Use rounded bar ends where supported.

Do not use too many unrelated colors in one bar series.

One dataset:

```text
Green
```

Multiple meaningful categories:

```text
Use chart palette
```

---

# Donut / Pie Charts

Use only when category proportions benefit from them.

Good use cases:

```text
Sentiment
Feedback sources
Category distribution
```

Avoid too many segments.

Prefer fewer than approximately 6 categories.

Use a legend where necessary.

---

# Tooltips

Chart tooltips should use dark elevated surfaces.

Example:

```text
Mobile Checkout
Sep 10

Feedback: 143
Negative: 89%
Growth: +48%
```

Style:

* Dark surface
* Thin border
* Small radius
* Clear labels
* High contrast
* Minimal shadow

---

# Cards

Dashboard cards should use:

```text
bg-surface
border-default
rounded-xl
```

Hover states should be subtle.

Interactive card hover:

```text
border becomes slightly stronger
background becomes slightly lighter
```

Avoid large movement animations on hover.

---

# AI Insight Cards

AI insights can use a slightly stronger green identity.

Example:

```text
┌─────────────────────────────────────┐
│ ✦ AI INSIGHT                       │
│                                     │
│ Checkout complaints increased       │
│ significantly this week.            │
│                                     │
│ 143 reports · 89% negative          │
│                                     │
│ View evidence →                     │
└─────────────────────────────────────┘
```

Styling:

```text
Dark green-tinted background
Subtle green border
Green AI icon
White text
Muted metadata
```

Avoid bright green full-card backgrounds.

---

# Emerging Issue Cards

Use warning semantics.

Example:

```text
⚠ Emerging Issue

Mobile Checkout

31 reports today
+343%

High Severity
```

Use:

```text
orange or red status indicator
```

while keeping the card background dark.

---

# Badges

Use compact badges.

Examples:

```text
Positive
Negative
Bug
Feature Request
High
Processing
Completed
Failed
```

Badges should use tinted backgrounds rather than fully saturated fills.

Example:

```text
green text
green/10 background
green/20 border
```

---

# Buttons

## Primary Button

Primary CTA:

```text
Green background
Dark text or near-black text
Medium font weight
```

Example:

```text
Import Feedback
Create Project
Analyze Feedback
```

---

## Secondary Button

Use:

```text
dark surface
border
primary text
```

---

## Ghost Button

Use for low-priority actions:

```text
transparent
hover surface
```

---

## Destructive Button

Use red only for genuinely destructive behavior.

Examples:

```text
Delete Project
Remove Member
Delete Organization
```

---

# Inputs

Inputs should use:

```text
dark elevated background
subtle border
light text
muted placeholder
green focus ring
```

Focus should be clearly visible.

Avoid extremely bright borders.

---

# Tables

Feedback tables should feel dense and professional.

Use:

* Compact rows
* Subtle row separators
* Sticky header where useful
* Hover state
* Inline badges
* Clear column alignment

Example:

```text
Feedback                Sentiment   Topic       Severity    Date
──────────────────────────────────────────────────────────────
Search is very slow     Negative    Search      High        Sep 10
Love the dashboard      Positive    UI          Low         Sep 10
Add Google login        Neutral     Auth        Medium      Sep 9
```

Do not make every table row a separate card.

---

# Filters

Filter bars should remain compact.

Example:

```text
[Search...] [Sentiment ▾] [Topic ▾] [Source ▾] [Date ▾]
```

Use pills only when they improve clarity.

Do not create large filter cards.

---

# Search

Global search should feel like a command/search experience.

Desktop shortcut:

```text
⌘ K
```

Example:

```text
Search feedback, topics, insights...
```

Use a command dialog for broader application navigation where appropriate.

---

# Empty States

Empty states should explain what the user should do next.

Example:

```text
No feedback yet

Import customer feedback to start discovering
topics, sentiment, and emerging issues.

[Import Feedback]
```

Use small illustrations or icons sparingly.

Do not use large cartoon artwork in the analytics workspace.

---

# Loading States

Use skeleton components matching the actual final layout.

Avoid large global spinners.

Examples:

```text
Metric card skeleton
Chart skeleton
Table row skeleton
Insight skeleton
```

For AI processing, show meaningful status.

Example:

```text
Analyzing feedback...

143 / 500 processed
████████░░░░ 28%
```

---

# Motion

Animations should be subtle and fast.

Recommended duration:

```text
150ms–250ms
```

Good animation uses:

* Sidebar transition
* Dropdown appearance
* Modal transition
* Chart appearance
* Hover states
* Progress updates
* Number transitions

Avoid:

* Constant floating elements
* Large bouncing animation
* Excessive page transitions
* Distracting glowing effects

---

# Data Animation

Charts may animate once when first loaded.

Metric values may transition when changing date ranges.

Do not continuously animate dashboard charts.

Analytics dashboards should feel stable.

---

# Modals

Use centered dialog overlays for focused actions.

Examples:

```text
Create Project
Invite Member
Delete Confirmation
Import Settings
```

Use:

```text
dark elevated surface
backdrop blur
subtle border
rounded-xl
```

Avoid huge modals when a dedicated page is more appropriate.

---

# Sheets

Use side sheets for contextual secondary workflows.

Examples:

```text
Feedback details
Filters
Quick topic details
Mobile navigation
```

---

# Icons

Use Lucide React.

Use stroke-based icons only.

Recommended sizes:

```text
Inline metadata:     h-3.5 w-3.5
Navigation:          h-4 w-4
Buttons:             h-4 w-4
Primary icon:        h-5 w-5
Empty state:         h-8 w-8
```

Do not mix multiple icon libraries unless absolutely necessary.

---

# Icon Color

Default:

```text
Muted foreground
```

Active:

```text
Primary foreground
```

Primary navigation/brand:

```text
Green
```

Status icons should follow semantic colors.

---

# Logo Direction

SignalFlow's logo should be simple and geometric.

Possible concepts:

```text
Signal wave
Pulse
Flowing data points
Connected nodes
Abstract S
Analytics line
```

Primary logo treatment:

```text
Green icon
White wordmark
```

Avoid overly complex AI brain imagery.

---

# Main Dashboard Example

```text
┌──────────────────────────────────────────────────────────────────┐
│ Overview                         Search...       🔔       Avatar │
├─────────────┬────────────────────────────────────────────────────┤
│             │                                                    │
│ SignalFlow  │  Good morning                                     │
│             │  Here is what customers are saying.               │
│ ● Overview  │                                                    │
│   Feedback  │  ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│   Topics    │  │ Feedback  │ │ Negative  │ │ Topics    │       │
│   Insights  │  │  12,481   │ │   38%     │ │    47     │       │
│   Analytics │  │  +12.4%   │ │   -3.2%   │ │    +5     │       │
│             │  └───────────┘ └───────────┘ └───────────┘       │
│ ──────────  │                                                    │
│ Integration │  Feedback Volume                                  │
│ Team        │  ┌─────────────────────────────────────────────┐   │
│ Billing     │  │                  ╭────╮                     │   │
│ Settings    │  │          ╭───────╯    ╰────╮               │   │
│             │  │─────╮────╯                  ╰────           │   │
│             │  └─────────────────────────────────────────────┘   │
│             │                                                    │
│             │  Trending Topics          Emerging Issues          │
│             │  ┌─────────────────┐      ┌───────────────────┐   │
│             │  │ ● Checkout +82% │      │ ⚠ Checkout       │   │
│             │  │ ● Search   +31% │      │ 31 reports       │   │
│             │  │ ● Login    +19% │      │ +343%            │   │
│             │  └─────────────────┘      └───────────────────┘   │
└─────────────┴────────────────────────────────────────────────────┘
```

---

# Dashboard Visual Balance

Aim for approximately:

```text
70% neutral dark UI
20% green brand identity
10% colorful analytics/status accents
```

This is a visual guideline, not a strict mathematical requirement.

The purpose is to ensure the dashboard feels colorful without becoming chaotic.

---

# Green Theme Rule

Green is the identity color.

It should dominate:

```text
Primary CTA
Active navigation
Logo
Focus state
Main analytics line
Selected controls
AI identity
Important highlights
```

It should not dominate:

```text
Every chart series
Every status badge
Every card background
Every heading
Every border
```

Use other semantic and chart colors to create variety.

---

# Dashboard Density

The dashboard should be information-rich but not crowded.

Use:

```text
24px–32px page spacing
16px–24px card padding
12px–16px internal element gaps
```

Prefer grouping related information over adding more whitespace simply for aesthetics.

---

# Responsive Rules

## Desktop

Use:

* Full sidebar
* Multi-column dashboard
* Full chart layouts
* Data tables

## Tablet

Use:

* Collapsible sidebar
* Two-column metrics
* Reduced chart columns

## Mobile

Use:

* Drawer navigation
* Single-column cards
* Horizontally scrollable tables where unavoidable
* Simplified charts
* Compact page headers

Do not remove important data solely because the viewport is smaller.

---

# Accessibility

Maintain accessible contrast against dark backgrounds.

Do not rely on color alone for:

* Sentiment
* Severity
* Success
* Failure
* Trends

Pair colors with:

* Icons
* Text
* Labels
* Shapes

All interactive elements require visible focus states.

---

# UI Invariants

These rules must remain consistent across the application.

1. The application is dark mode only.

2. Green is the primary brand and interaction color.

3. Dashboard surfaces remain mostly neutral and dark.

4. Color is primarily introduced through data visualization, statuses, topics, and trends.

5. Primary actions use green.

6. Destructive actions use red.

7. Warning states use orange or amber.

8. Charts use the defined chart palette.

9. Sentiment colors remain consistent everywhere.

10. Navigation uses a consistent active-state pattern.

11. Components use design tokens instead of arbitrary hardcoded colors.

12. `components/ui/*` remains generic.

13. Dashboard cards use consistent radius, border, and spacing rules.

14. Animations remain subtle.

15. AI-related components must fit the standard application design instead of introducing a completely different visual language.

16. The dashboard must remain responsive.

17. Loading, empty, error, and processing states must be intentionally designed.

18. Important analytics remain readable without relying solely on color.

---

# Core Design Principle

SignalFlow should look like a serious analytics product with a distinctive green identity.

The design system follows:

```text
Dark foundation
      +
Green brand identity
      +
Colorful analytics
      +
Clear typography
      +
Structured data hierarchy
      +
Subtle interaction
```

The dashboard should feel modern and visually impressive, but the data must always remain the focus.

**Dark surfaces provide consistency.**

**Green provides identity.**

**Colorful data provides energy.**
