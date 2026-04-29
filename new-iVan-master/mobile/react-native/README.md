# Mobile Home Page (React Native)

This folder contains a mobile implementation of your web home page at `app/[locale]/(public)/page.js`, scoped only to this one screen.

## What is included

- `src/screens/HomePageScreen.tsx`
  - Full React Native screen matching your page sections:
    - Hero with location badge, chips, stats and typewriter search
    - Promo banner
    - On-demand, Book now and Services carousels
    - Headline block
    - 2x2 feature grid
    - Coming soon horizontal cards
    - Final CTA
- `src/components/TypewriterPlaceholder.tsx`
  - Typewriter text animation for the search row.
- `src/components/ServiceCarousel.tsx`
  - Reusable horizontal carousel with dots indicator and service cards.
- `src/data/homePageMock.ts`
  - Mock content and image URLs so the screen runs immediately.

## Design system mapping (from web to mobile)

- **Primary text:** `#0f172a`
- **Accent pink:** `#ec4899`
- **Background:** `#f8fafc`
- **Card radius:** 14-18
- **Button radius:** 10-12
- **Spacing scale:** 8 / 10 / 12 / 16 / 24
- **Typography:**
  - Hero title: 30 / 36, weight 900
  - Section title: 22-24, weight 800-900
  - Body: 14-15
  - Captions: 12-13

## Behavior parity notes

- Location row is tappable and exposed as `onOpenLocation`.
- Search bar tap is exposed as `onExplorePress`.
- Service card tap is exposed as `onSelectService(serviceId)`.
- CTA tap is exposed as `onGetStarted`.
- Typewriter placeholder mirrors your phrase rotation concept.

## How to use in an Expo project

1. Create Expo app:
   - `npx create-expo-app swipped-mobile`
2. Copy `mobile/react-native/src` into your Expo app.
3. Install icon package:
   - `npx expo install @expo/vector-icons`
4. Render screen in `App.tsx`:

```tsx
import HomePageScreen from "./src/screens/HomePageScreen";

export default function App() {
  return <HomePageScreen />;
}
```

## Next step for production

- Replace `homePageMock.ts` with API calls to:
  - `/api/public/services`
  - `/api/stats`
- Hook `onOpenLocation` to a location modal/screen and persist using secure storage or async storage.
