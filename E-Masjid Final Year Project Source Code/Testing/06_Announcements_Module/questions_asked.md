# 06 Announcements Module - Questions Asked

> Phase 6 - Step A
> Date: 2026-07-31
> Module: Announcements Module

---

Before I begin writing the automated E2E tests for the Announcements module (Phase 6), I have a few clarifying questions regarding how the module should behave:

## Q1 - Urgent Announcements Display
The Announcement model has an isUrgent flag. Should urgent announcements have a specific visual distinction (e.g. a red banner, a siren icon, or pinned to the very top of the homepage) compared to regular announcements in the public view? For the FYP demo, I want to ensure my tests look for the right visual cues if it's urgent.

## Q2 - Draft vs Published Status
The model supports status: ['draft', 'published']. When an admin creates a "draft" announcement, it should definitely be hidden from the public. Do you want me to write specific E2E test cases to verify that draft announcements are completely excluded from the public /announcements page and homepage widget?

## Q3 - Pagination on Public View
Should the dedicated public announcements page (/announcements) implement pagination if there are many announcements, or is a simple list of the latest 10-20 announcements acceptable for your final year project demo? 

---

Waiting for your answers (Q1-Q3) before I proceed to Step B (automated testing for Phase 6).
