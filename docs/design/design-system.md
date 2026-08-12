# KeyAbroad 2.0 Design System

## 1. Core Principles
- **Premium & Trustworthy**: Avoid generic templates. Use deep, sophisticated colors with crisp typography to convey authority and reliability.
- **Data-Driven & Human**: Balance complex data (tables, pipelines) with human elements (avatars, conversational UI).
- **Technology-Enabled**: Utilize subtle micro-animations (Framer Motion) to make the interface feel responsive, but avoid excessive/distracting movement.

## 2. Design Tokens

### Typography
- **Primary Font**: *Inter* or *Geist* (Clean, highly legible for data-dense tables).
- **Heading Font**: *Outfit* or *Plus Jakarta Sans* (Modern, premium feel for marketing pages).
- **Scale**:
  - H1: 48px/56px (Mobile: 36px)
  - H2: 36px/40px (Mobile: 28px)
  - H3: 24px/32px
  - Body: 16px/24px (Mobile: 15px)
  - Small: 14px/20px

### Color Palette (Premium Indigo/Slate)
- **Primary**: `indigo-600` (#4F46E5) to `indigo-700` (Trust, Education).
- **Secondary**: `slate-900` (#0F172A) (Authority, premium contrast).
- **Accent**: `emerald-500` (#10B981) (Success, eligibility, accepted visas).
- **Background**: `slate-50` (#F8FAFC) for app background, `white` (#FFFFFF) for cards.
- **Borders**: `slate-200` (#E2E8F0) (Subtle, clean separation).
- **Text**: `slate-900` (Headings), `slate-600` (Body text), `slate-400` (Placeholders).

### Spacing & Layout
- **Spacing Scale**: 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96).
- **Border Radius**: `0.5rem` (8px) for buttons/inputs, `1rem` (16px) for cards and modals.
- **Shadows**:
  - Subtle (Cards): `0 1px 3px rgba(0,0,0,0.05)`
  - Elevated (Dropdowns/Modals): `0 10px 25px -5px rgba(0,0,0,0.1)`

### Responsive Breakpoints
- **sm**: 640px (Mobile landscape)
- **md**: 768px (Tablet portrait)
- **lg**: 1024px (Tablet landscape / Small laptop)
- **xl**: 1280px (Desktop)
- **2xl**: 1536px (Large screens)

## 3. Component Architecture (shadcn/ui based)
*Components are implemented in `packages/ui` (or `src/components/ui`) and share a strict adherence to the design tokens above.*

- **Forms**: React Hook Form + Zod. Inputs use floating labels or clear stacking.
- **Data Display**: Tables (TanStack Table) with sorting, filtering, and pagination.
- **Feedback**: Toasts (Sonner) for transient success/error, Alerts for persistent state, Skeletons for loading.
- **Overlays**: Dialogs (centered modals) for critical actions, Sheets (side drawers) for detail views without losing context.
