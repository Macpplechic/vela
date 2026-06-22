# Vela Wellness — App Store Submission Package
## Version 1.1.0 · Build 26

---

## 1. BEFORE YOU SUBMIT — CHECKLIST

### App Store Connect setup
- [ ] Sign into appstoreconnect.apple.com
- [ ] Go to Vela Wellness → + Version → enter **1.1.0**
- [ ] Paste the "What's New" text below into the release notes field
- [ ] Set the subtitle (30 chars): **Perimenopause Hormone Tracker**
- [ ] Set the keyword field (100 chars): `menopause,perimenopause,hot flash,hormone,night sweats,HRT,brain fog,cycle,women 40,supplement`
- [ ] Confirm privacy policy URL resolves: https://velaforwomen.com/privacy
- [ ] Confirm support URL resolves: https://velaforwomen.com

### Screenshots (use files in screenshots/appstore/)
- [ ] Open each HTML file in Chrome, set window to 390×844, screenshot
- [ ] Upload all 6 to App Store Connect under iPhone 6.7" display
- [ ] Upload same 6 under iPhone 6.1" display (required)
- [ ] Optional: create iPad screenshots if you want wider distribution

### Review information
- [ ] Demo account: velareviewer01@gmail.com / VelaTest2026!
- [ ] Notes for reviewer (paste below into App Review Notes field)
- [ ] Sign the Paid Apps Agreement if prompted (Business section)

### IAP / Subscriptions
- [ ] Confirm Vela Full Access ($8.99) is still active in App Store Connect
- [ ] Confirm FluxLog ($4.99) and CoolDown ($4.99) products are ready
- [ ] Test purchase flow on a real device using a sandbox account

### HealthKit (NEW in 1.1.0)
- [ ] Apple Health entitlement is already added (Vela.entitlements)
- [ ] NSHealthShareUsageDescription is in app.json
- [ ] run `npm install react-native-health && npx pod-install ios` before building

---

## 2. WHAT'S NEW (App Store release notes — paste exactly)

```
Version 1.1.0 — Your biggest update yet.

VELA COACH ✦
Ask your personal wellness coach anything — hot flashes, sleep, brain fog, HRT, bone health. Coach reads your own data and gives you specific answers, not generic advice. Powered by on-device AI on iOS 26+ (your data never leaves your phone).

SYMPTOM PATTERN CALENDAR
Navigate back 12 months. See sleep quality, flow, and symptoms all in one view. Tap any day for a full detail card. Monthly pattern summary shows your top 5 symptoms with frequency bars.

HRT & MEDICATION TRACKER
Log hormone therapy and medications. Vela automatically compares your symptom load before and after you started — so you can see if it's working.

BONE HEALTH SCORE
Your calcium from Peri Plate, D3 adherence, and lifestyle factors rolled into a 0–100 bone health score. DEXA scan tracker included.

6-WEEK CBT PROGRAM
The same cognitive behavioral therapy used in NHS menopause clinics. 30 daily exercises that reduce hot flash distress by up to 50% in clinical trials.

PARTNER MODE
Generate a plain-language weekly digest for a partner or family member. Share what your week actually looked like — in words they can understand.

DOCTOR APPOINTMENT PREP
Select what you want to discuss (HRT, bone, mood, labs, more). Vela generates a PDF with your symptom data and specific talking points for each topic.

90-DAY TRENDS
Charts for symptom frequency, hot flash trend, sleep quality curve, nutrition adherence, and supplement consistency over 30, 60, or 90 days.

PHOTO FOOD LOGGING
Snap a meal and Vela identifies every food and estimates your hormone-relevant nutrients automatically.

APPLE HEALTH SYNC
Sleep, steps, heart rate, and HRV from Apple Health appear automatically on your dashboard.

Bug fixes and performance improvements.
```

---

## 3. APP REVIEW NOTES (paste into App Review Notes field)

```
Thank you for reviewing Vela Wellness 1.1.0.

DEMO ACCOUNT:
Email: velareviewer01@gmail.com
Password: VelaTest2026!

SUBSCRIPTION TESTING:
Use the Apple Sandbox environment. All three IAP products are configured:
- Vela Full Access: $8.99/month (com.velawellness.app.bundle_monthly)
- FluxLog: $4.99/month (com.velawellness.app.fluxlog_monthly)
- CoolDown: $4.99/month (com.velawellness.app.cooldown_monthly)

The paywall appears on the FluxLog and CoolDown tabs for non-subscribers.
A 7-day free trial is available via the "Try free for 7 days" button.

APPLE HEALTH:
The app requests read-only access to sleep, steps, heart rate, and HRV.
No health data is written back to Apple Health.
Permission prompt appears the first time the user taps "Connect Apple Health" on the dashboard.

VELA COACH:
The AI coach uses on-device rule-based logic (not a third-party AI API).
On iOS 26+ devices with Apple Intelligence enabled, it uses the on-device Foundation Models framework.
No user data is sent to any external server for the coach feature.

MEDICAL DISCLAIMER:
A full medical disclaimer is present in the app (Profile → About) and in the App Store description. All health content includes citations from The Menopause Society, NIH, and peer-reviewed research.

UGC (THE SHIFT COMMUNITY):
The community tab (The Shift) includes:
- Content reporting functionality
- User blocking
- Terms of service gate before posting
- Posts are moderated

CBT PROGRAM:
The 6-week CBT program is educational content based on published research.
It does not provide medical diagnoses or treatment. A disclaimer is shown at program start.
```

---

## 4. BUILD COMMAND

Run this from your Mac after pulling the latest:

```bash
cd ~/vela
git pull origin main
npm install react-native-health
npx pod-install ios
eas build --platform ios --auto-submit
```

EAS will automatically increment the build number (autoIncrement: true in eas.json).

---

## 5. APP STORE DESCRIPTION (full — paste into Description field)

Vela is the perimenopause and menopause tracker built for the second half of a woman's life.

You are not losing your mind. You are in one of the most significant hormonal transitions of your life. Vela gives you the tools, the data, and the community to move through it with clarity.

**VELA COACH — ON-DEVICE AI**
Ask your personal wellness coach anything — why am I getting hot flashes? How is my sleep? What should I discuss with my doctor? Coach reads your own data and gives specific answers. On iOS 26+, powered by Apple Intelligence — your data never leaves your phone.

**FLUXLOG — SYMPTOM & PATTERN INTELLIGENCE**
Log symptoms alongside food, stress, sleep, alcohol, caffeine, and exercise. Vela detects correlations so you know what's causing what. Navigate your 12-month pattern calendar. See what's changed.

**PERI PLATE — HORMONE-SMART NUTRITION**
Every food scored for anti-inflammatory impact. Track protein, fiber, calcium, magnesium, omega-3, and phytoestrogens against targets built for your hormonal phase. Snap a meal photo and Vela identifies everything automatically.

**COOLDOWN — NERVOUS SYSTEM PROTOCOLS**
Four guided breathwork protocols, five somatic techniques, and our 6-week CBT program — the same approach used in NHS menopause clinics, proven to reduce hot flash distress by up to 50%.

**HRT & MEDICATION TRACKER**
Log what you take. See how your symptoms change before and after you start. Bring real data to your doctor.

**BONE HEALTH SCORE**
Your calcium intake, D3 adherence, exercise, and lifestyle factors rolled into a score. DEXA scan tracker included.

**DOCTOR-READY PDF EXPORT**
Generate a 90-day health report — symptoms, sleep, nutrition, supplements. Select your discussion topics and get specific talking points and questions for your appointment.

**PARTNER MODE**
Share a plain-language weekly digest with someone you trust. Help them understand what your week actually looked like.

**90-DAY TRENDS**
Charts for symptom frequency, sleep quality, nutrition adherence, and supplement consistency over 30, 60, or 90 days.

**THE SHIFT — COMMUNITY**
Connect with women who get it because they are living it. Share wins, ask questions, find support.

SCIENCE-BACKED. WOMEN-LED.
Every protocol in Vela is rooted in peer-reviewed research. Citations available in-app under Profile → Research & Sources.

Terms of Use: https://velaforwomen.com/terms
Privacy Policy: https://velaforwomen.com/privacy

MEDICAL DISCLAIMER: Vela is for informational and wellness tracking purposes only. Not a substitute for professional medical advice. Always consult your physician.

---

## 6. PRICING

Primary subscription: **Vela Full Access — $8.99/month**
Individual: FluxLog $4.99/month, CoolDown $4.99/month

Recommended: Set Vela Full Access as the prominently featured option. The individual subscriptions remain for users who want only one feature.

---

## 7. CATEGORY & METADATA

- Primary Category: Health & Fitness
- Secondary Category: Medical (optional — may require additional review)
- Age Rating: 9+ (User Generated Content, Health/Wellness)
- Languages: English

---

## 8. AFTER APPROVAL

Once approved:
1. Request ratings via the in-app review prompt (already implemented — fires after 7-day streak)
2. Post launch content to @velaforwomen on social
3. Share the App Store link in The Shift community
4. Submit Vela to femtech directories: FemTech World, Rock Health, Crunchbase
5. Reach out to perimenopause/menopause content creators for review partnerships
