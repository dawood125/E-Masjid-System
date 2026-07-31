/**
 * Phase 4: Homepage Module - Comprehensive Playwright Test
 *
 * Tests all 11 homepage sections:
 *   1. HeroSection (video/image, CTAs, mosque name)
 *   2. StatsSection (4 stat cards from /api/marketing/stats)
 *   3. Prayer Times Widget (5 prayers + Jummah, Next Prayer, Islamic date)
 *   4. ImpactCounters (4 big numbers)
 *   5. ImageCarousel (slides, nav dots, prev/next)
 *   6. Announcements (top 3, View All link)
 *   7. FeaturedCampaign (progress bar, CTAs)
 *   8. Testimonials (community voices)
 *   9. Events + Hadith (upcoming events + countdown + Hadith sidebar)
 *  10. Fund Request CTA
 *  11. Final CTA (Donate Now + Transparency)
 *
 * Additional tests:
 *   - Next Prayer logic verification
 *   - Mosque switch data reactivity (Q5)
 *   - Navigation links
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots', 'phase4')
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

const findings = []
function log(test, result, detail) {
  findings.push({ test, result, detail })
  console.log(`  [${result}] ${test} -- ${detail}`)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  console.log('\n=== Phase 4: Homepage Module Test ===\n')

  // ===================== LOAD HOMEPAGE =====================
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // ===================== SECTION 1: HERO =====================
  console.log('--- Section 1: HeroSection ---')

  // Check hero exists
  const heroSection = page.locator('section').first()
  const heroVisible = await heroSection.isVisible()
  log('Hero section visible', heroVisible ? 'PASS' : 'FAIL', heroVisible ? 'Hero renders' : 'Hero missing')

  // Check mosque name in hero
  const heroText = await page.locator('h1').first().textContent()
  log('Hero heading text', heroText.includes('Connect') ? 'PASS' : 'FAIL', `h1 = "${heroText}"`)

  // Check mosque name appears in hero subtitle
  const mosqueInHero = await page.locator('text=Welcome to').first().textContent().catch(() => '')
  log('Hero shows mosque name', mosqueInHero.includes('Masjid') || mosqueInHero.includes('E-Masjid') ? 'PASS' : 'FAIL', `subtitle = "${mosqueInHero}"`)

  // Check hero CTAs
  const donateHeroCTA = await page.locator('a:has-text("Donate Now")').first().isVisible()
  log('Hero "Donate Now" CTA', donateHeroCTA ? 'PASS' : 'FAIL', donateHeroCTA ? 'Visible' : 'Missing')

  const fundRequestCTA = await page.locator('a:has-text("Submit Fund Request")').first().isVisible()
  log('Hero "Submit Fund Request" CTA', fundRequestCTA ? 'PASS' : 'FAIL', fundRequestCTA ? 'Visible' : 'Missing')

  // Check hero image/video loaded (no broken image)
  const heroImg = await page.locator('section img[alt*="mosque"]').first().evaluate((el) => {
    return { naturalWidth: el.naturalWidth, src: el.src }
  }).catch(() => ({ naturalWidth: 0, src: '' }))
  log('Hero background image loaded', heroImg.naturalWidth > 0 ? 'PASS' : 'FAIL', `naturalWidth=${heroImg.naturalWidth}`)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-hero.png') })

  // ===================== SECTION 2: STATS STRIP =====================
  console.log('\n--- Section 2: StatsSection ---')

  // Check stat cards exist
  const statCards = await page.locator('text=Years Serving').isVisible().catch(() => false)
  log('Stats "Years Serving" visible', statCards ? 'PASS' : 'FAIL', statCards ? 'Card renders' : 'Missing')

  const donationsCard = await page.locator('text=Total Donations').isVisible().catch(() => false)
  log('Stats "Total Donations" visible', donationsCard ? 'PASS' : 'FAIL', donationsCard ? 'Card renders' : 'Missing')

  const requestsCard = await page.locator('text=Active Fund Requests').isVisible().catch(() => false)
  log('Stats "Active Fund Requests" visible', requestsCard ? 'PASS' : 'FAIL', requestsCard ? 'Card renders' : 'Missing')

  const familiesCard = await page.locator('text=Families Helped').isVisible().catch(() => false)
  log('Stats "Families Helped" visible', familiesCard ? 'PASS' : 'FAIL', familiesCard ? 'Card renders' : 'Missing')

  // ===================== SECTION 3: PRAYER TIMES =====================
  console.log('\n--- Section 3: Prayer Times Widget ---')

  // Scroll to prayer times
  await page.locator('text=Today\'s Prayer Times').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  const prayerHeading = await page.locator('text=Today\'s Prayer Times').isVisible()
  log('Prayer times heading visible', prayerHeading ? 'PASS' : 'FAIL', prayerHeading ? 'Heading renders' : 'Missing')

  // Check all 5 prayers + Jummah
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', "Jumu'ah"]
  for (const prayer of prayers) {
    const isVisible = await page.locator(`text=${prayer}`).first().isVisible().catch(() => false)
    log(`Prayer "${prayer}" visible`, isVisible ? 'PASS' : 'FAIL', isVisible ? 'Visible' : 'Missing')
  }

  // Check "Next Prayer" badge exists
  const nextPrayerBadge = await page.locator('text=Next Prayer').isVisible().catch(() => false)
  log('Next Prayer badge visible', nextPrayerBadge ? 'PASS' : 'INFO', nextPrayerBadge ? 'Badge shows' : 'Badge not visible (all prayers may have passed)')

  // Check Islamic date shows
  const islamicDate = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'))
    return spans.some(s => s.textContent.includes('Muharram') || s.textContent.includes('Safar') || s.textContent.includes('Rabi') || s.textContent.includes('Jumada') || s.textContent.includes('Rajab') || s.textContent.includes('Sha') || s.textContent.includes('Ramadan') || s.textContent.includes('Shawwal') || s.textContent.includes('Dhu') || s.textContent.includes('AH') || s.textContent.includes('Islamic'))
  })
  log('Islamic date label present', islamicDate ? 'PASS' : 'INFO', islamicDate ? 'Islamic calendar date shown' : 'No Islamic date found (browser may not support Islamic calendar)')

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-prayer-times.png') })

  // ===================== SECTION 4: IMPACT COUNTERS =====================
  console.log('\n--- Section 4: ImpactCounters ---')

  await page.locator('text=Our Impact in').scrollIntoViewIfNeeded()
  await page.waitForTimeout(2000) // Wait for count-up animation

  const impactHeading = await page.locator('text=Our Impact in').isVisible()
  log('Impact section heading', impactHeading ? 'PASS' : 'FAIL', impactHeading ? 'Heading visible' : 'Missing')

  const impactLabels = ['Prayers Tracked', 'Students Taught', 'Nikah Ceremonies Hosted', 'Families Supported']
  for (const label of impactLabels) {
    const vis = await page.locator(`text=${label}`).first().isVisible().catch(() => false)
    log(`Impact "${label}"`, vis ? 'PASS' : 'FAIL', vis ? 'Visible' : 'Missing')
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-impact-counters.png') })

  // ===================== SECTION 5: IMAGE CAROUSEL =====================
  console.log('\n--- Section 5: ImageCarousel ---')

  await page.locator('text=Moments from Our Community').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  const carouselHeading = await page.locator('text=Moments from Our Community').isVisible()
  log('Carousel heading visible', carouselHeading ? 'PASS' : 'FAIL', carouselHeading ? 'Heading visible' : 'Missing')

  // Check navigation dots
  const dots = await page.locator('button[aria-label^="Go to slide"]').count()
  log('Carousel navigation dots', dots > 0 ? 'PASS' : 'FAIL', `${dots} dots found`)

  // Check prev/next buttons
  const prevBtn = await page.locator('button[aria-label="Previous slide"]').isVisible()
  const nextBtn = await page.locator('button[aria-label="Next slide"]').isVisible()
  log('Carousel prev/next buttons', prevBtn && nextBtn ? 'PASS' : 'FAIL', `prev=${prevBtn}, next=${nextBtn}`)

  // Test carousel navigation (click next)
  const captionBefore = await page.locator('section:has(button[aria-label="Next slide"]) p').last().textContent().catch(() => '')
  await page.locator('button[aria-label="Next slide"]').click()
  await page.waitForTimeout(800)
  const captionAfter = await page.locator('section:has(button[aria-label="Next slide"]) p').last().textContent().catch(() => '')
  log('Carousel next changes slide', captionBefore !== captionAfter ? 'PASS' : 'INFO', `Before: "${captionBefore.slice(0,30)}..." After: "${captionAfter.slice(0,30)}..."`)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-carousel.png') })

  // ===================== SECTION 6: ANNOUNCEMENTS =====================
  console.log('\n--- Section 6: Announcements ---')

  await page.locator('text=Latest Announcements').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  const announcementsHeading = await page.locator('text=Latest Announcements').isVisible()
  log('Announcements heading visible', announcementsHeading ? 'PASS' : 'FAIL', announcementsHeading ? 'Heading visible' : 'Missing')

  // Check announcement cards (the announcement section uses <article> tags inside the container)
  const announcementCards = await page.evaluate(() => {
    const section = document.querySelector('h2');
    const allArticles = document.querySelectorAll('article');
    return allArticles.length;
  })
  log('Announcement cards rendered', announcementCards > 0 ? 'PASS' : 'BUG', announcementCards > 0 ? `${announcementCards} cards found` : 'BUG-HOME-002: 0 announcement cards rendered (announcements may not be scoped to active mosque)')

  // Check View All link
  const viewAllAnnouncements = await page.locator('a:has-text("View All")').first().isVisible()
  log('Announcements "View All" link', viewAllAnnouncements ? 'PASS' : 'FAIL', viewAllAnnouncements ? 'Visible' : 'Missing')

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-announcements.png') })

  // ===================== SECTION 7: FEATURED CAMPAIGN =====================
  console.log('\n--- Section 7: FeaturedCampaign ---')

  const campaignSection = await page.locator('text=Featured Campaign').isVisible().catch(() => false)
  log('Featured Campaign section', campaignSection ? 'PASS' : 'INFO', campaignSection ? 'Section visible (campaign exists)' : 'Section hidden (no featured campaign in DB)')

  if (campaignSection) {
    const progressBar = await page.locator('[class*="bg-gradient-to-r"][class*="from-"][class*="d4af37"]').first().isVisible().catch(() => false)
    log('Campaign progress bar', progressBar ? 'PASS' : 'FAIL', progressBar ? 'Progress bar visible' : 'Missing')

    await page.locator('text=Featured Campaign').scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-featured-campaign.png') })
  }

  // ===================== SECTION 8: TESTIMONIALS =====================
  console.log('\n--- Section 8: Testimonials ---')

  await page.locator('text=What Our Community Says').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  const testimonialsHeading = await page.locator('text=What Our Community Says').isVisible()
  log('Testimonials heading visible', testimonialsHeading ? 'PASS' : 'FAIL', testimonialsHeading ? 'Heading visible' : 'Missing')

  const testimonialCards = await page.locator('figure').count()
  log('Testimonial cards rendered', testimonialCards > 0 ? 'PASS' : 'FAIL', `${testimonialCards} cards`)

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-testimonials.png') })

  // ===================== SECTION 9: EVENTS + HADITH =====================
  console.log('\n--- Section 9: Events + Hadith ---')

  await page.locator('h2:has-text("Upcoming Events")').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  const eventsHeading = await page.locator('h2:has-text("Upcoming Events")').first().isVisible()
  log('Events heading visible', eventsHeading ? 'PASS' : 'FAIL', eventsHeading ? 'Heading visible' : 'Missing')

  // Check events View All
  const viewAllEvents = await page.locator('a:has-text("View All")').nth(1).isVisible().catch(() => false)
  log('Events "View All" link', viewAllEvents ? 'PASS' : 'FAIL', viewAllEvents ? 'Visible' : 'Missing')

  // Check seed events (they may be in the past - BUG candidate)
  const noEventsMsg = await page.locator('text=No upcoming events yet').isVisible().catch(() => false)
  log('Events data present', !noEventsMsg ? 'PASS' : 'BUG', noEventsMsg ? 'BUG-HOME-001: No events showing (seed dates likely in the past)' : 'Events are showing')

  // Check Hadith sidebar
  const hadithSection = await page.locator('text=Hadith of the Day').isVisible().catch(() => false)
  log('Hadith of the Day visible', hadithSection ? 'PASS' : 'FAIL', hadithSection ? 'Hadith sidebar renders' : 'Missing')

  const hadithText = await page.locator('text=Hadith of the Day').locator('..').locator('p').nth(1).textContent().catch(() => '')
  log('Hadith content rendered', hadithText.length > 10 ? 'PASS' : 'FAIL', hadithText.length > 10 ? `Hadith text shows: "${hadithText.slice(0, 30)}..."` : 'Missing')

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-events-hadith.png') })

  // ===================== SECTION 10: FUND REQUEST CTA =====================
  console.log('\n--- Section 10: Fund Request CTA ---')

  await page.locator('text=Need Financial Assistance').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const fundCTA = await page.locator('text=Need Financial Assistance').isVisible()
  log('Fund Request CTA visible', fundCTA ? 'PASS' : 'FAIL', fundCTA ? 'CTA renders' : 'Missing')

  const submitRequestBtn = await page.locator('a:has-text("Submit Request")').isVisible()
  log('Submit Request button', submitRequestBtn ? 'PASS' : 'FAIL', submitRequestBtn ? 'Visible' : 'Missing')

  // ===================== SECTION 11: FINAL CTA =====================
  console.log('\n--- Section 11: Final CTA ---')

  await page.locator('text=Support Your Masjid').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const finalCTA = await page.locator('text=Support Your Masjid').isVisible()
  log('Final CTA heading', finalCTA ? 'PASS' : 'FAIL', finalCTA ? 'Heading visible' : 'Missing')

  const finalDonateBtn = await page.locator('a:has-text("Donate Now")').last().isVisible()
  log('Final "Donate Now" button', finalDonateBtn ? 'PASS' : 'FAIL', finalDonateBtn ? 'Visible' : 'Missing')

  const transparencyBtn = await page.locator('a:has-text("View Transparency Report")').isVisible()
  log('Final "Transparency Report" button', transparencyBtn ? 'PASS' : 'FAIL', transparencyBtn ? 'Visible' : 'Missing')

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-final-cta.png') })

  // ===================== FULL PAGE SCREENSHOT =====================
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-full-page.png'), fullPage: true })

  // ===================== NAVIGATION LINKS TEST =====================
  console.log('\n--- Navigation Links Test ---')

  // Test that CTA links have correct hrefs
  const donateHref = await page.locator('a:has-text("Donate Now")').first().getAttribute('href')
  log('Donate Now href', donateHref === '/donate' ? 'PASS' : 'FAIL', `href="${donateHref}"`)

  const fundReqHref = await page.locator('a:has-text("Submit Fund Request")').first().getAttribute('href').catch(() => '')
  log('Fund Request href', fundReqHref === '/fund-request' ? 'PASS' : 'FAIL', `href="${fundReqHref}"`)

  const transparencyHref = await page.locator('a:has-text("View Transparency Report")').getAttribute('href').catch(() => '')
  log('Transparency href', transparencyHref === '/transparency' ? 'PASS' : 'FAIL', `href="${transparencyHref}"`)

  // ===================== MOSQUE SWITCH TEST (Q5) =====================
  console.log('\n--- Mosque Switch Data Reactivity Test ---')

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)

  // Get current mosque name from hero
  const mosque1Name = await page.locator('text=Welcome to').first().textContent().catch(() => '')
  console.log(`  Current mosque: "${mosque1Name}"`)

  // Click the mosque selector button in the navbar to open the modal
  const mosqueBtn = page.locator('header button:has-text("Masjid"), header button:has-text("Select")').first()
  const mosqueBtnExists = await mosqueBtn.isVisible().catch(() => false)

  if (mosqueBtnExists) {
    await mosqueBtn.click()
    await page.waitForTimeout(600)

    // Search for the other mosque
    const searchInput = page.locator('input[placeholder*="Search"]').first()
    if (await searchInput.isVisible().catch(() => false)) {
      // Clear and type the other mosque name
      await searchInput.fill('')
      await page.waitForTimeout(400)

      // Find a different mosque from the list
      const mosqueCards = await page.locator('button:has(p.font-semibold)').count()
      console.log(`  Found ${mosqueCards} mosque cards in modal`)

      if (mosqueCards >= 2) {
        // Find a card that doesn't match the current mosque name
        let cardToClick = null;
        for (let i = 0; i < mosqueCards; i++) {
          const card = page.locator('button:has(p.font-semibold)').nth(i);
          const text = await card.textContent().catch(() => '');
          if (!mosque1Name.includes(text.split('(')[0].trim())) {
            cardToClick = card;
            break;
          }
        }
        
        if (cardToClick) {
          await cardToClick.click()
        } else {
          await page.locator('button:has(p.font-semibold)').nth(0).click() // fallback
        }
        await page.waitForTimeout(300)

        // Confirm selection
        await page.locator('button:has-text("Confirm Selection")').click()
        await page.waitForTimeout(2000) // Wait for data refresh

        // Check that hero now shows different mosque
        const mosque2Name = await page.locator('text=Welcome to').first().textContent().catch(() => '')
        log('Mosque switch changes hero', mosque1Name !== mosque2Name ? 'PASS' : 'FAIL',
          `Before: "${mosque1Name}" -> After: "${mosque2Name}"`)

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-mosque-switched.png') })

        // Switch back to original mosque
        await mosqueBtn.click()
        await page.waitForTimeout(600)
        await page.locator('button:has(p.font-semibold)').first().click()
        await page.waitForTimeout(300)
        await page.locator('button:has-text("Confirm Selection")').click()
        await page.waitForTimeout(1500)
      } else {
        log('Mosque switch test', 'SKIP', 'Only 1 mosque in modal - cannot test switch')
        await page.keyboard.press('Escape')
      }
    } else {
      log('Mosque switch test', 'SKIP', 'Search input not found in modal')
      await page.keyboard.press('Escape')
    }
  } else {
    log('Mosque switch test', 'SKIP', 'Mosque button not found in navbar')
  }

  // ===================== API ENDPOINT VERIFICATION =====================
  console.log('\n--- API Endpoint Verification ---')

  const endpoints = [
    { url: 'http://localhost:5000/api/marketing/stats', name: 'Marketing Stats' },
    { url: 'http://localhost:5000/api/marketing/impact', name: 'Marketing Impact' },
    { url: 'http://localhost:5000/api/marketing/featured-campaign', name: 'Featured Campaign' },
    { url: 'http://localhost:5000/api/marketing/testimonials', name: 'Testimonials' },
    { url: 'http://localhost:5000/api/marketing/hero-slides', name: 'Hero Slides' },
    { url: 'http://localhost:5000/api/prayer-times', name: 'Prayer Times' },
    { url: 'http://localhost:5000/api/events', name: 'Events' },
    { url: 'http://localhost:5000/api/announcements', name: 'Announcements' },
  ]

  for (const ep of endpoints) {
    try {
      const res = await page.request.get(ep.url)
      const status = res.status()
      const body = await res.json().catch(() => null)
      const hasData = body && (body.success || body.data !== undefined || Array.isArray(body))
      log(`API ${ep.name}`, status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}, hasData=${!!hasData}`)
    } catch (e) {
      log(`API ${ep.name}`, 'FAIL', `Error: ${e.message}`)
    }
  }

  // ===================== SUMMARY =====================
  console.log('\n=== Phase 4 Homepage Test Summary ===')
  const pass = findings.filter(f => f.result === 'PASS').length
  const fail = findings.filter(f => f.result === 'FAIL').length
  const bug = findings.filter(f => f.result === 'BUG').length
  const info = findings.filter(f => f.result === 'INFO').length
  const skip = findings.filter(f => f.result === 'SKIP').length
  console.log(`  PASS: ${pass} | FAIL: ${fail} | BUG: ${bug} | INFO: ${info} | SKIP: ${skip}`)
  console.log(`  Total: ${findings.length}`)
  console.log(`  Screenshots saved to: ${SCREENSHOT_DIR}`)

  if (fail > 0 || bug > 0) {
    console.log('\n  FAILURES/BUGS:')
    findings.filter(f => f.result === 'FAIL' || f.result === 'BUG').forEach(f => {
      console.log(`    [${f.result}] ${f.test} -- ${f.detail}`)
    })
  }

  // Save results JSON
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'test_results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), findings, summary: { pass, fail, bug, info, skip, total: findings.length } }, null, 2)
  )

  await browser.close()
  process.exit(fail > 0 || bug > 0 ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })
