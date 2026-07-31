# 04 Homepage Module - Questions Asked

> Phase 4 - Step A
> Date: 2026-07-31
> Module: Homepage (public landing page at /)

---

## Homepage Section Inventory (what we are testing)

The homepage currently renders these sections in order:

1. HeroSection - Full-bleed image/video background, mosque name, CTAs
2. StatsSection - 4 auto-computed stat cards (Years Serving, Total Donations PKR, Active Requests, Families Helped)
3. Prayer Times Widget - Today 5 prayers + Jummah, Next Prayer indicator, Islamic + Gregorian date
4. ImpactCounters - 4 big animated numbers (scroll-triggered count-up)
5. ImageCarousel - Life at the Masjid - 6 hero slides from admin, auto-rotating
6. Announcements - Top 3 announcements with category tags, View All link
7. FeaturedCampaign - Featured donation campaign with progress bar + CTA
8. Testimonials - 3 community member testimonial cards
9. Events + Hadith - Top 2 upcoming events with countdown timer + Hadith of the Day sidebar
10. Fund Request CTA - Zakat/Sadaqah fund request call-to-action
11. Final CTA - Support Your Masjid with Donate Now + View Transparency Report buttons

---

## Q1 - Seed data freshness for the FYP demo

The seed data has events with hardcoded dates in mid-2026 (June 15, June 20). By now (July 31) those events are in the past, so the Upcoming Events section and countdown timer will show No upcoming events yet.

Options:
- (A) I update the seed events to future dates (e.g., August 2026) so the demo always shows upcoming events
- (B) Leave seed dates as-is - you will re-seed with fresh dates before the demo
- (C) Make the seed dates dynamic (always today + 7 days and today + 14 days)

Which do you prefer?

---

## Q2 - Hero video asset

The HeroSection component tries to load /assets/images/hero/hero-loop.mp4 (with a fallback to /assets/images/hero/hero-desktop.jpg).

Does this video/image file actually exist in your frontend/public/assets/images/hero/ folder? If not, the hero will show a solid green background (the fallback color #064e3b). I want to verify this during testing - if the file is missing, I will log it as a bug and we can either:
- (A) Generate a placeholder image for the demo
- (B) Leave the green gradient (it still looks good)

---

## Q3 - Hadith of the Day

The Hadith of the Day sidebar in the Events section is currently hardcoded (Sahih Bukhari 3559: The best among you are those who have the best manners and character.).

Is this acceptable for the FYP demo, or should it:
- (A) Stay hardcoded - one good hadith is fine for the demo (recommended - saves time)
- (B) Rotate through a few hadiths (I would add a small array and pick one per day)
- (C) Be fetched from a backend endpoint (over-engineering for FYP)

---

## Q4 - Prayer times Next Prayer logic

The homepage has a getNextPrayer() function that compares the current system time against today prayer times to highlight the Next Prayer card.

For the FYP demo, do you want me to verify this logic works correctly at different times of day? (I would test with mocked times: before Fajr, between Zuhr and Asr, after Isha). If you will demo at a specific time, tell me what time and I will make sure it looks right.

---

## Q5 - Mosque-scoped data on the homepage

The homepage fetches prayer times, events, and announcements scoped to activeMosqueId. When a user switches mosques in the navbar, the homepage data should change.

Should I test this cross-mosque switch during Phase 4? (The mosque switch was already tested in Phase 3, but Phase 4 specifically tests the homepage data changing when the mosque changes - prayers, events, announcements from mosque 2 instead of mosque 1.)

---

Waiting for your answers (Q1-Q5) before I proceed to Step B (automated testing).
