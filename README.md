# Vela — React Native App

A luxury wellness app for perimenopause and beyond. Built with Expo + React Native.

---

## What's in this project

```
vela/
├── app/
│   ├── _layout.tsx          # Root layout, font loading, splash screen
│   ├── index.tsx            # Splash / entry point
│   ├── quiz.tsx             # Phase quiz onboarding
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tab navigator (6 tabs)
│       ├── ritual.tsx       # Morning ritual home screen
│       ├── plate.tsx        # Food & nutrition tracker
│       ├── flux.tsx         # FluxLog — symptom + trigger tracker (trial gate)
│       ├── cool.tsx         # CoolDown — breathwork & sleep coach (trial gate)
│       ├── shift.tsx        # Community — The Shift
│       └── profile.tsx      # Profile, supplements, doctor prep, creator program
├── constants/
│   ├── Colors.ts            # Full Vela color system + font names
│   └── Data.ts              # All app data: phases, foods, supplements, etc.
├── hooks/
│   └── useVelaStore.ts      # Central state + AsyncStorage persistence
├── assets/                  # Add icon.png, splash.png here (see below)
├── app.json                 # Expo config
├── eas.json                 # Build + submit config
├── package.json
├── babel.config.js
└── tsconfig.json
```

---

## Step 1 — Install prerequisites (one-time setup)

You need Node.js and the Expo CLI installed on your Mac or PC.

### Install Node.js
Go to https://nodejs.org and download the LTS version. Install it normally.

### Install Expo CLI and EAS CLI
Open Terminal (Mac) or Command Prompt (Windows) and run:
```bash
npm install -g expo-cli eas-cli
```

### Create an Expo account (free)
Go to https://expo.dev and sign up for a free account.

---

## Step 2 — Set up the project

Open Terminal, navigate to the folder where you saved this project, then run:

```bash
cd vela
npm install
```

This installs all dependencies. Takes 2–3 minutes.

---

## Step 3 — Add app icons and splash screen

You need 3 image files in the `/assets` folder:

| File | Size | What it is |
|------|------|------------|
| `icon.png` | 1024×1024px | App icon (shown on phone home screen) |
| `splash.png` | 1284×2778px | Splash screen image (shown on launch) |
| `adaptive-icon.png` | 1024×1024px | Android adaptive icon foreground |

**Design tip:** Use the Vela wordmark on a deep plum (#3D1F3A) background for a beautiful splash. Canva works great for this. Export as PNG.

---

## Step 4 — Run the app on your phone (for testing)

### Install Expo Go on your phone
Search "Expo Go" in the App Store and install it.

### Start the development server
```bash
npx expo start
```

Scan the QR code that appears with your phone camera (iPhone) or the Expo Go app (Android). The app will open live on your phone. Any change you save in the code updates instantly.

---

## Step 5 — Link your Expo account for builds
```bash
eas login
eas init
```

This creates a project ID. Copy it and paste it into `app.json` where it says `"YOUR_EAS_PROJECT_ID"`.

---

## Step 6 — Build for iOS (App Store)

You need an Apple Developer account ($99/year) from developer.apple.com before this step.

### Configure your Apple credentials in eas.json
Open `eas.json` and fill in:
- `appleId` — your Apple ID email
- `ascAppId` — your App Store Connect app ID (created at appstoreconnect.apple.com)
- `appleTeamId` — found in developer.apple.com under Membership

### Build the app
```bash
eas build --platform ios --profile production
```

EAS builds your app in the cloud — no Mac required. Takes about 15–20 minutes.
You'll get a download link when it's done.

---

## Step 7 — Submit to App Store

```bash
eas submit --platform ios --profile production
```

This uploads your build directly to App Store Connect. Then:

1. Go to https://appstoreconnect.apple.com
2. Click your app → "App Store" tab
3. Fill in: description, keywords, screenshots, pricing ($9.99/month recommended)
4. Add the medical disclaimer (see below)
5. Submit for review

Apple reviews in 24–48 hours.

---

## Medical disclaimer (required by Apple)

Add this to your App Store description and inside the app's Profile tab:

> Vela is a wellness and lifestyle app intended for informational purposes only. It is not a medical device and does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making decisions about your health, medications, or supplements.

---

## Phase 2 — Add a backend (user accounts + data sync)

Right now all data saves locally on the device. To sync across devices and handle subscriptions, you need Supabase.

1. Go to https://supabase.com and create a free project
2. Install the client: `npm install @supabase/supabase-js`
3. Replace `AsyncStorage` calls in `useVelaStore.ts` with Supabase queries
4. Add auth screens (email/password or Apple Sign In)

A developer can complete Phase 2 in about 1–2 weeks.

---

## Phase 3 — Add subscriptions (trials + paid unlock)

Use RevenueCat to handle iOS in-app purchases.

1. Go to https://revenuecat.com and create a free account
2. Install: `npm install react-native-purchases`
3. Create products in App Store Connect:
   - `vela_premium_monthly` — $9.99/month (all features)
   - `vela_fluxlog_monthly` — $4.99/month (FluxLog add-on)
   - `vela_cooldown_monthly` — $4.99/month (CoolDown add-on)
4. Link RevenueCat to your App Store Connect account
5. Replace the `fluxUnlocked` / `coolUnlocked` state in `useVelaStore.ts` with RevenueCat purchase checks

A developer can complete Phase 3 in about 3–5 days.

---

## Hiring a developer

If you'd rather hand this off, post on Upwork with:
- "React Native / Expo developer needed"
- Share this entire project folder
- Phases needed: Backend (Supabase) + Payments (RevenueCat) + App Store submission
- Budget: $3,000–$6,000 / Timeline: 4–6 weeks

The prototype is complete — a developer just needs to wire up accounts and payments.

---

## Tech stack summary

| Layer | Tool | Cost |
|-------|------|------|
| App framework | Expo + React Native | Free |
| Navigation | Expo Router | Free |
| Local storage | AsyncStorage | Free |
| Cloud backend | Supabase | Free up to 500MB |
| Subscriptions | RevenueCat | Free up to $2.5k MRR |
| Builds | EAS Build | Free (30 builds/month) |
| App Store | Apple Developer | $99/year |

---

## Questions?

Every file in this project is heavily commented. The best place to start is:
- `constants/Data.ts` — change any copy, foods, supplements, or phases here
- `constants/Colors.ts` — change the brand colors here
- `app/(tabs)/ritual.tsx` — the main screen users see every day

Good luck, Alicia. Vela is going to help a lot of women. 🌿
