

# Fix: Purple accent colors in Teacher Portal

## Problem
The `.teacher-portal` CSS class correctly overrides `--primary` to purple, but the override isn't taking effect. The most likely cause is that Tailwind's `@layer base` combined with CSS specificity makes the `:root` / `.dark` declarations on `<html>` take precedence over the `.teacher-portal` class on a nested `<div>`.

## Solution
Move the `.teacher-portal` class from the nested `<div>` inside `TeacherLayout` to the `<html>` element, placing it at the same DOM level as the `dark` class. This ensures CSS custom property overrides work reliably.

### Changes

1. **Create a `usePortalTheme` hook** that adds/removes the `teacher-portal` class on `document.documentElement` (the `<html>` element), just like `next-themes` does for the `dark` class.

2. **Update `TeacherLayout.tsx`** - Call `usePortalTheme('teacher')` to apply the class on mount, remove on unmount. Remove the `<div className="teacher-portal">` wrapper.

3. **Update `Layout.tsx`** - Call `usePortalTheme('student')` to ensure the class is removed when viewing the student portal.

4. **Update `Auth.tsx`** - Instead of `className={isTeacher ? "teacher-portal" : ""}`, use the hook or a `useEffect` to toggle the class on `<html>` based on the pill toggle state.

This approach mirrors how dark mode works and guarantees the CSS variables cascade to all elements, including fixed-position sidebars and portals.

