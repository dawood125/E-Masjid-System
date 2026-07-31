# 05 Prayer Timings Module - Manual Testing Guide

**Status:** Ready for Testing ✅

Please follow these steps to manually verify the Prayer Timings module on your end before we begin the next phase.

---

### Test 1: Verify Initial Homepage Prayer Times
**What You're Testing:** The public view correctly fetches and displays today's prayer times for the active mosque.
**Steps to Follow:**
1. Open the frontend in your browser: `http://localhost:5173/` (or `http://127.0.0.1:5174/` if you are using that port)
2. Scroll down to the "Today's Prayer Times" widget.
3. Observe the displayed time for **Fajr**.
4. Check that the "Next Prayer" highlighted card is accurate based on your system clock.
**What Should Happen:** Prayer times are displayed clearly, the grid is formatted correctly, and the next prayer is highlighted.
**Mark Result:** ☐ PASSED

---

### Test 2: Admin Login and Navigation
**What You're Testing:** The admin can successfully access the dashboard and prayer times management page.
**Steps to Follow:**
1. Go to `http://localhost:5173/admin/login`
2. Enter email: `admin@emasjid.pk`
3. Enter password: `admin123`
4. Click Login.
5. In the Admin Dashboard sidebar, click on "Prayer Times".
**What Should Happen:** You are logged in successfully and navigated to the Prayer Times management interface.
**Mark Result:** ☐ PASS ☐ FAIL

---

### Test 3: Update Prayer Times
**What You're Testing:** The admin can modify prayer times and save them successfully.
**Steps to Follow:**
1. On the Admin Prayer Times page, find the input for **Fajr**.
2. Change the Fajr time (e.g., from `05:30` to `05:45`).
3. Scroll down and click the "Update Prayer Times" button.
**What Should Happen:** A green success toast appears saying "Prayer times updated successfully".
**Mark Result:** ☐ PASS ☐ FAIL

---

### Test 4: Verify Public Reactivity
**What You're Testing:** Changes made by the admin are immediately reflected on the public homepage.
**Steps to Follow:**
1. Open a new tab and go back to the homepage `http://localhost:5173/`.
2. Scroll to the Prayer Times widget.
3. Look at the time for **Fajr**.
**What Should Happen:** The Fajr time should display the exact new time you set in Test 3.
**Mark Result:** ☐ PASS ☐ FAIL

---

### Test 5: Verify Multi-Mosque Switch
**What You're Testing:** Prayer times change when the active mosque is changed.
**Steps to Follow:**
1. On the homepage, use the Navbar dropdown to switch from "Masjid Al-Noor" to the other mosque.
2. Observe the Prayer Times widget.
**What Should Happen:** The prayer times refresh and display the times configured for the newly selected mosque.
**Mark Result:** ☐ PASS ☐ FAIL

---

If all tests pass, we are ready to move on!
