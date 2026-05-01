# Form Guidelines

## Reuse Existing UI

- Use the existing components under `src/components/ui/form` by default when building or updating forms.
- Before creating a new shared form primitive, confirm whether the component should live under `src/components/ui/form` or inside the relevant route's `components` directory.

## New Implementations

- If the required form component does not exist in `src/components/ui/form`, implement it separately instead of forcing an existing component to cover an unrelated use case.
- Put route-specific form components under that route's `components` directory.
- Put reusable form primitives under `src/components/ui/form` only after confirming that the component should be shared.

## Submit Feedback

- After every form submit, always show a toast that clearly indicates whether the action succeeded or failed.
- Use a success toast for completed actions and an error toast for failed actions.
- Do not leave submit results implicit. Users should be able to tell the outcome immediately from the UI.
