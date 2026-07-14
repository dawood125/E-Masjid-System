/**
 * Find what makes the inner navbar 440px wide at 320px viewport
 */
const { chromium } = require('playwright')
;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 320, height: 568 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  const page = await ctx.newPage()
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const data = await page.evaluate(() => {
    const header = document.querySelector('header')
    const innerContainer = header.children[0]
    const innerR = innerContainer.getBoundingClientRect()
    const children = Array.from(innerContainer.children).map((c, i) => {
      const r = c.getBoundingClientRect()
      const cs = getComputedStyle(c)
      return {
        index: i,
        tag: c.tagName,
        cls: c.className.slice(0, 60),
        display: cs.display,
        visibility: cs.visibility,
        width: Math.round(r.width),
        x: Math.round(r.x),
        right: Math.round(r.right),
        children: Array.from(c.children).map((cc, j) => {
          const cr = cc.getBoundingClientRect()
          const ccs = getComputedStyle(cc)
          return {
            index: j,
            tag: cc.tagName,
            cls: cc.className.slice(0, 50),
            display: ccs.display,
            width: Math.round(cr.width),
            x: Math.round(cr.x),
            right: Math.round(cr.right),
          }
        }),
      }
    })
    return {
      innerContainerWidth: Math.round(innerR.width),
      innerContainerLeft: Math.round(innerR.left),
      innerContainerRight: Math.round(innerR.right),
      viewport: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
      children,
    }
  })
  console.log(JSON.stringify(data, null, 2))
  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
