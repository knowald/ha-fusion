# Change 1 (CH01): Add Negation Composite Condition ('not') to Visibility Tree

## Background & Motivation
In ha-fusion, dashboard sections can have conditional visibility rules (`section.visibility`). Currently, composite branching only supports `'and'` (all subconditions must be true) and `'or'` (at least one subcondition must be true). Users frequently need to express negative logic—for instance, "show this section only when NOT in guest mode" or "show this section when NOT (state = 'unavailable' OR state = 'off')". Without a logical NOT composite operator, users are forced to enumerate inverse states manually across all sensors, which becomes unmaintainable.

## Functional Requirement
Extend the Composite Visibility Condition Tree (`Condition` interface in `src/lib/Types.ts` and evaluator in `src/lib/Conditional.ts`) to support a `'not'` composite condition:
1. `condition: 'not'` containing child conditions in `conditions?: Condition[]`.
2. The condition evaluates to `true` if and only if **none** of its child sub-conditions are met (logical negation / De Morgan's inversion over its child conditions).
3. If `conditions` is empty or undefined, `'not'` evaluates to `false` (safe fallback).

## Code Smell & Refactoring
- **Code Smell**: Switch Statement / Cyclomatic Complexity Code Smell in `validateCondition()` (`src/lib/Conditional.ts`). The original implementation uses a hardcoded procedural `switch (condition?.condition)` statement that must be modified every time a new condition type is introduced (violating the Open-Closed Principle).
- **Refactoring Strategy**: Refactor `validateCondition` to use an extensible Strategy Dispatch Table (`CONDITION_EVALUATORS` map). The dispatch table cleanly maps condition type discriminants to dedicated evaluator functions, eliminating procedural switch sprawl while preserving 100% backward compatibility.
