# Change 1 (CH01): Acceptance Criteria

## AC-01: Type Interface Extension
- The `Condition` interface in `src/lib/Types.ts` must allow `'not'` as a valid `condition` string discriminant:
  `condition?: 'state' | 'numeric_state' | 'screen' | 'or' | 'and' | 'not';`

## AC-02: Functional Evaluation of 'not' Conditions
- Given a `'not'` condition containing a single child condition that evaluates to `true`, `validateCondition` must return `false`.
- Given a `'not'` condition containing a single child condition that evaluates to `false`, `validateCondition` must return `true`.
- Given a `'not'` condition with multiple subconditions, it must return `true` if and only if **none** of the child subconditions evaluate to `true` (`!conditions.some(c => validateCondition(...))`).
- Given an empty or missing `conditions` list on a `'not'` condition, `validateCondition` must return `false`.

## AC-03: Recursive Composite Nesting
- `'not'` conditions must compose arbitrarily with `'and'`, `'or'`, and leaf conditions (`state`, `numeric_state`, `screen`).
  Example: `not` containing an `or` group must invert the entire group.

## AC-04: Behavior Preservation & Existing Functionality
- All existing condition types (`state`, `numeric_state`, `screen`, `and`, `or`) must continue to evaluate with identical semantics.
- All existing Vitest tests must pass without regression.

## AC-05: Unit Testing & Metrics
- A dedicated Vitest test suite `src/lib/Conditional.test.ts` must be created covering all cases (leaves, groups, nested `not`, edge cases).
- Actual test logs must be recorded.
