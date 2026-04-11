---
name: EmptyState Component Interface
description: EmptyState requires icon (LucideIcon), uses message not title — commonly misused
type: feedback
---

The `EmptyState` component at `src/components/shared/EmptyState.tsx` has this interface:

```ts
interface EmptyStateProps {
    icon: LucideIcon;   // REQUIRED — renders a large icon
    message: string;    // REQUIRED — main text
    description?: string;
    action?: React.ReactNode;
}
```

**Why:** Previous agent sessions wrote `<EmptyState title="..." description="..." />` without `icon`, which caused runtime issues (icon was undefined, rendered nothing). TypeScript didn't catch this due to loose checking at the call site.

**How to apply:** Always pass an appropriate icon when using EmptyState. Import the icon from lucide-react.
