---
name: ESLint Patterns to Avoid
description: Recurring ESLint errors found when writing new components — rules enforced by this project's Airbnb config
type: feedback
---

Always break multi-item imports onto separate lines when the line exceeds ~80 chars:
```ts
// WRONG — triggers object-curly-newline
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// CORRECT
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
```

Use template literals, not string concatenation:
```ts
// WRONG — triggers prefer-template
format(new Date(date + 'T12:00:00'), ...)

// CORRECT
format(new Date(`${date}T12:00:00`), ...)
```

Mixed JSX text + expressions must be separated:
```tsx
// WRONG — triggers react/jsx-one-expression-per-line
<span>{count} dias</span>

// CORRECT
<span>{count}{' dias'}</span>
// OR (better, no curly needed for plain text adjacent to expression):
<span>
    {count}
    {' dias'}
</span>
```

Arrow functions returning multiline expressions need parentheses:
```ts
// WRONG — triggers implicit-arrow-linebreak
mutationFn: (params) =>
    someFunction(params),

// CORRECT
mutationFn: (params) => (
    someFunction(params)
),
```

Object literals with >1 property spanning multiple lines need each property on its own line:
```ts
// WRONG — triggers object-property-newline
{ label: 'Foo', href: '/foo', icon: Bar, description: 'Desc' }

// CORRECT
{
    label: 'Foo',
    href: '/foo',
    icon: Bar,
    description: 'Desc',
}
```

Don't use curly braces around plain string text in JSX when adjacent to other elements:
```tsx
// WRONG — triggers react/jsx-curly-brace-presence
<span>{'%'}</span>

// CORRECT
<span>%</span>
```

**Why:** Project uses Airbnb-based ESLint config with strict formatting rules. These errors block CI.

**How to apply:** Review all new files against these patterns before committing. Run `npx eslint <file>` on new files before committing.
