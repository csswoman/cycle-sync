| Task | Status | Notes |
| :--- | :--- | :--- |
| Map new chat & AI icons in `Icon.tsx` | Complete | Added `ChatCircleDots`, `ChatDots`, `PaperPlaneRight`, `Robot` |
| Add assistant translation keys in `translations.ts` | Complete | Added title, subtitle, status, quick actions, tooltips in ES & EN |
| Update floating assistant button in `AppLayoutClient.tsx` | Complete | Replaced icon with `ChatCircleDots` + sun pulse badge, fixed sizing to `w-14 h-14 md:w-16 md:h-16`, smooth transitions |
| Polish `SmartAssistant.tsx` header & tabs | Complete | Header with status dot, title, rounded close button, segmented pill tabs with icons |
| Redesign `ChatTab.tsx` chat styles | Complete | Added assistant avatar, refined chat bubbles, animated 3-dot typing indicator, quick suggestions pills, dedicated send button |
| Update `ImageTab.tsx` and `VideoTab.tsx` icons & styles | Complete | Replaced legacy material-symbols with `Icon`, modernized upload boxes |
| Run test and build verification | Complete | vitest (24 passed), tsc (0 errors), next build (0 errors) |
| Simplify PMOS symptom FAQ to compact tooltip popover | Complete | Replaced expanding accordion cards with ultra-compact cards and a summarized tooltip (?) popover with 3 concise bullet points |
| Impeccable layout, typeset & adapt redesign | Complete | Scaled up font sizes to 14-16px, cards expand/collapse individually on click, customized symptom routine stored in localStorage with clean modal dialog |
| Reorganize `/routines` layout with tabs and Impeccable hierarchy | Complete | Segmented navigation bar with 4 focused tabs: Para tu Fase, Videos Guiados, Mis Rutinas, Diario y Registro; sticky header with blur; instant switching preserving state |
| Verify tests and TypeScript compilation | Complete | Vitest (33 passed), Next.js build (0 errors) |
| Improve /planner layout, typography, and structure with Impeccable craft | Complete | Elevated WeeklyPlanner.tsx with cycle phase badge, weekly completion bar, unified temporal toolbar with shrink protection, responsive 7-day grid, meal slot icons and polished grocery/pantry panels with quick suggestions. Vitest (46 passed), tsc (0 errors), next build (0 errors). |
