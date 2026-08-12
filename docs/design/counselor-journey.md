# Counselor Journey

## 1. Daily Triage
The counselor logs in to the Admin Portal.
**UX Focus**: The Dashboard must immediately answer "What requires my attention right now?".
**Components**:
- Alerts for unread student messages.
- Data tables highlighting new leads assigned to them.
- Tasks/follow-ups due today.

## 2. Lead Conversion
Counselor reviews a raw enquiry.
**UI Pattern**: Split-pane view. Left side shows lead details and academic history. Right side is a workspace (notes, actions, email templates).
**Goal**: Convert lead to an active Student account with one click, triggering the portal invite email.

## 3. Student Management (The 360 View)
Counselor manages an active student.
**UX Focus**: Density without clutter.
Instead of jumping between 5 different pages to see a student's documents, applications, and messages, the UI must use **Tabs** within a single `/students/[id]` route.

## 4. Application Processing
Moving applications across stages.
**UI Pattern**: Kanban Board (Drag-and-drop).
**Feedback**: Immediate optimistic UI updates when moving a card, with subtle loading indicators to confirm database sync.
