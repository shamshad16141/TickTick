# TickTick - Project Architecture

## 1. Overview
TickTick is a React Native mobile application built using the Expo framework. It leverages Expo Router for modern, file-based routing and is structured using a Drawer Navigator combined with a Tab Navigator for the main functionalities. The application features functional time-management screens such as an alarm, clock, stopwatch, timer, and a dedicated focus mode.

## 2. Tech Stack & Dependencies
* **Core:** React Native (v0.81) / React (v19)
* **Framework:** Expo (v54), configured with `newArchEnabled` (React Native New Architecture).
* **Navigation:** Expo Router (`expo-router` v6), utilizing deep linking, file-based navigation, Drawer, and Tab navigation options from React Navigation (`@react-navigation/drawer`, `@react-navigation/bottom-tabs`).
* **Animations:** `react-native-reanimated`, `lottie-react-native`, and `@lottiefiles/dotlottie-react` (handling custom Lottie animations like `Cat_Movement.lottie`).
* **Hardware/System Integrations:** 
  * `expo-notifications` (for background scheduling/alerts)
  * `@react-native-community/datetimepicker`
  * `expo-haptics` (for tactical feedback)
* **Storage:** `@react-native-async-storage/async-storage` for local persistence.
* **UI/Styles:** Custom components combined with Expo utilities (`expo-linear-gradient`, `expo-blur`, icons).
* **Language:** TypeScript.

## 3. Directory Structure

```text
TickTick/
├── android/                 # Native Android build and configuration files
├── animation/               # Stores Lottie animations (e.g., Cat_Movement.lottie)
├── app/                     # File-based routing (Expo Router) Root Directory
│   ├── _layout.tsx          # Root layout defining the ThemeProvider and Drawer navigation
│   ├── index.tsx            # Application entry point/redirect mechanism
│   ├── focus.tsx            # Focus Mode Screen
│   ├── settings.tsx         # User Settings Screen
│   └── (tabs)/              # Bottom Tab Navigator
│       ├── _layout.tsx      # Tab configuration
│       ├── alarm.tsx        # Alarm scheduling and management
│       ├── clock.tsx        # World clock / Local time interface
│       ├── stopwatch.tsx    # Stopwatch tracking interface
│       └── timer.tsx        # Countdown timer interface
├── assets/                  # Images, custom fonts, splash screens, and icons
├── components/              # Reusable React components
│   ├── ui/                  # Presentational UI components (icons, collapsibles)
│   ├── themed-text.tsx      # Themed typography
│   └── themed-view.tsx      # Themed containers
├── constants/               # Global constants and configuration colors
│   └── theme.ts
├── context/                 # Application-wide React Context providers
│   └── ThemeContext.tsx     # Handles app-wide light/dark mode variations
├── hooks/                   # Custom business logic and utility React hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── scripts/                 # Utility scripts (e.g., project reset tasks)
├── app.json                 # Expo manifest configuration
├── package.json             # NPM dependencies & scripts
└── tsconfig.json            # TypeScript build configuration
```

## 4. Application Architecture

### 4.1 Routing & Navigation
Routing relies heavily on `expo-router` patterns.
* **Root Navigation (`app/_layout.tsx`):** Wraps the entire application inside a `ThemeProvider`. A `Drawer` acts as the root navigator containing the main Tab viewer (`(tabs)`), a global `focus` mode, and `settings`.
* **Tab Navigation (`app/(tabs)/_layout.tsx`):** Provides contextual sub-navigation containing main functional screens: Alarm, Clock, Stopwatch, and Timer. This segregates navigation cleanly from modal / sidebar actions.

### 4.2 State Management
* **Global Theming:** Implemented through custom contexts (`context/ThemeContext.tsx`) and consumed via custom hooks (`hooks/use-theme-color.ts`).
* **Persistence:** Relying on `AsyncStorage` to maintain alarms, saved application states, and the user's focus tracking out of the application's runtime boundaries.

### 4.3 Key Workflows
* **Alarm / Scheduling:** Leverages integrated React Native datetime pickers coupled with `expo-notifications` to orchestrate background and foreground user alerts.
* **Animations & Micro-interactions:** Uses `lottie-react-native` to render JSON-based vector animations in the UI (likely within the Focus or Timer screens to visualize time passage and maintain user engagement).

## 5. Build & Deployment Patterns
* **Expo EAS:** Contains configurations connecting the app to Expo Application Services (`projectId` configured for EAS).
* **Build Scripts:** Implemented commands exist for running directly on Android (`expo run:android`), iOS (`expo run:ios`), as well as web builds. Note the `newArchEnabled` is active highlighting this application uses the new Fabric renderer and TurboModules.