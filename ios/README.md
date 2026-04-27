# CUOnline iOS

Native iOS companion to the [web app at the repo root](../) — student portal for the same Supabase backend.

## Stack

- SwiftUI, iOS 17+
- [supabase-swift](https://github.com/supabase/supabase-swift) (Auth, Postgres, Storage, Functions)
- Native SwiftUI Charts

## Setup

1. Open `CUOnline.xcodeproj` in Xcode 15+.
2. Copy the config template and fill in the project values:
   ```sh
   cp CUOnline/Config.example.xcconfig CUOnline/Config.xcconfig
   ```
   The example already contains the same Supabase URL and anon key the web app uses (see `../.env`).
3. Resolve Swift packages (File → Packages → Resolve Package Versions). The Supabase Swift SDK is declared in the project.
4. Select the **CUOnline** scheme and an iPhone 15 simulator. Build & run (⌘R).

## Backend

The app is **read/write against the same Supabase project** as the web app — no separate backend, no schema changes. Auth, courses, assessments, attendance, timetable, quizzes, marks, and the AI assistant edge function are all shared.

Out-of-Figma features (campus picker, direct/group chat, language picker) were intentionally skipped because they have no backing data in the current schema.

## Folder Map

```
CUOnline/
├── App/            RootView, AppState (session gating)
├── Models/         Codable structs mirroring Supabase tables
├── Services/       Supabase client wrappers (one per domain)
├── ViewModels/     @Observable, one per screen
├── Views/          SwiftUI screens (Splash, Auth, Dashboard, Course, ...)
├── Theme/          Colors and typography
└── Resources/      Static markdown for About / Privacy
```

## Notes

- Login uses **email + password** (matches Supabase auth). The Figma's "Reg No" field is rendered as the email field.
- Push notification delivery is not wired up — the toggle in Settings is a local UserDefaults flag for now.
- Document upload / proctored quizzes are deferred (the backend supports both; iOS port can come later).
