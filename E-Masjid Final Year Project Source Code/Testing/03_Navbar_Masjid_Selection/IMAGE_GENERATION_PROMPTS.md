# E-Masjid — Image & Video Generation Prompts

> **Project:** E-Masjid System (FYP) — MERN stack
> **Use case:** Generate all marketing assets for the homepage (`Home.jsx`)
> **Tool:** Google Gemini Pro (paid subscription)
> **Total prompts:** 10 (1 hero desktop + 1 hero mobile + 1 video + 6 gallery + 3 testimonials)
> **Order to generate:** Hero first → Video → Hero mobile → Gallery → Testimonials

---

## 🏛️ Global Style Guide (applies to ALL prompts)

**Consistent visual identity across all assets:**

- **Location style:** Local Pakistani mosque, small-to-medium size (200-500 worshippers), resembling those in Sheikhupura, Punjab
- **Architecture:** Traditional Mughal-influenced — white marble or sandstone, single central dome, 2-4 minarets, tile work (blue, green, white), arched entryways, central courtyard
- **People:** Pakistani men in shalwar kameez, topi/cap; women in shayla/hijab; children in traditional dress
- **Lighting:** Mostly natural daylight, with some golden hour shots
- **Color palette consistency with codebase:** Greens (#047857 family), golds (#d4af37 family), whites, creams, warm wood tones
- **Time period:** Modern day, clean and well-maintained (not historical/old)
- **AVOID in all prompts:** no text, no watermarks, no logos, no people facing camera directly, no identifiable brand names, no modern glass-steel mosques (too Dubai), no Saudi cube-style (too Makkah/Madinah), no Middle Eastern arabesque patterns that don't match Pakistani style

---

## 📁 File Structure

Save all generated assets here:

```
frontend/src/assets/images/
├── hero/
│   ├── hero-desktop.jpg
│   └── hero-mobile.jpg
├── gallery/
│   ├── gallery-fajr.jpg
│   ├── gallery-quran.jpg
│   ├── gallery-madrassa.jpg
│   ├── gallery-iftar.jpg
│   ├── gallery-nikah.jpg
│   └── gallery-courtyard.jpg
├── testimonials/
│   ├── testimonial-1.jpg
│   ├── testimonial-2.jpg
│   └── testimonial-3.jpg
└── video/
    └── hero-loop.mp4
```

---

## 🎯 Generation Order (recommended)

1. **Step 1 (CRITICAL):** Generate `hero-desktop.jpg` — this is the most important asset. The whole homepage look depends on it.
2. **Step 2:** Generate `hero-loop.mp4` — the video
3. **Step 3:** Generate `hero-mobile.jpg` — the mobile crop
4. **Step 4:** Generate the 6 gallery images in any order
5. **Step 5:** Generate the 3 testimonial images

**After each generation:** open the homepage in your browser, refresh, and check the new image. If it doesn't look right, tell me and I'll refine the prompt.

---

# 📷 IMAGE 1 — Hero Desktop (HIGHEST PRIORITY)

**Filename:** `hero-desktop.jpg`
**Path:** `frontend/src/assets/images/hero/hero-desktop.jpg`
**Aspect ratio:** 16:9 (1920x1080 pixels)

### Prompt (copy-paste into Gemini Pro):

```
A breathtaking wide-angle photograph of a beautiful small-to-medium-sized local Pakistani mosque in Sheikhupura, Punjab, captured at golden hour just after sunset. The mosque features classic Mughal-influenced architecture: a single white marble central dome with a golden finial, two slender minarets flanking the main entrance, intricate blue and green tile work (kashi-kari) around the main archway, and a central courtyard with a marble fountain. Warm golden sunlight hits the white marble walls, creating a soft orange glow. The sky behind the mosque is a gradient from soft peach-orange near the horizon to deep blue-purple above. A few worshippers in white shalwar kameez are walking toward the main entrance in the middle distance, slightly silhouetted. The foreground shows a clean marble pathway with manicured green grass on either side. The composition is shot from ground level with the camera looking slightly upward at the mosque, making it feel grand and welcoming. No text, no watermarks, no logos, no people facing camera. Shot on Canon EOS R5 with 24mm wide-angle lens, f/8, golden hour lighting. Cinematic, peaceful, spiritual mood. Photojournalistic realism. 16:9 aspect ratio.
```

### Avoid:
- "no text" (negative prompt)
- "no watermarks or logos"
- "no people looking at camera"
- "no Saudi cube-style architecture"
- "no modern glass buildings"

### Success criteria:
- [ ] White marble with golden glow visible
- [ ] Dome + minarets clearly visible
- [ ] Warm orange/peach sky behind
- [ ] 2-4 small people walking toward mosque (NOT facing camera)
- [ ] Lush green grass + marble pathway in foreground
- [ ] NO text anywhere
- [ ] NO Saudi cube (must have dome)
- [ ] NO identifiable brand

### Estimated Gemini credits: ~1 generation (may need 2-3 attempts to get right)

---

# 🎬 VIDEO — Hero Loop (HIGH IMPACT)

**Filename:** `hero-loop.mp4`
**Path:** `frontend/src/assets/images/video/hero-loop.mp4`
**Aspect ratio:** 16:9 (1280x720 minimum)
**Duration:** 5-8 seconds (Gemini Pro video limit)
**Format:** MP4

### Prompt (copy-paste into Gemini Pro video generation):

```
Cinematic 5-second slow aerial drone shot of a beautiful small-to-medium local Pakistani mosque in Sheikhupura, Punjab, captured at golden hour. The camera starts low, looking up at the white marble dome and minarets against a warm orange-peach sky. Then smoothly tilts up and slowly pushes forward, revealing the full mosque with its blue and green tile work (kashi-kari), the central courtyard with worshippers in white shalwar kameez walking peacefully, and green lawns on either side. The lighting is golden hour — warm orange glow on the marble. Subtle wind moves the tree leaves slightly. The mood is serene, spiritual, welcoming. Traditional Mughal-influenced Pakistani architecture, NOT Saudi cube style, NOT glass modern. Loop-friendly ending: the final frame should match the starting frame so the video can loop seamlessly. No text, no watermarks, no logos. Cinematic color grading with warm tones. 1280x720 resolution, 5-8 seconds.
```

### Success criteria:
- [ ] 5-8 second duration
- [ ] 1280x720 or higher resolution
- [ ] First frame ≈ last frame (for seamless loop)
- [ ] Visible: dome, minarets, marble, courtyard, worshippers
- [ ] NO text/watermarks
- [ ] NOT Saudi cube style
- [ ] Golden hour lighting

### Loop test: After generating, play the video — does the end transition smoothly back to the beginning? If not, regenerate with: "ensure the final frame is identical to the starting frame for seamless looping."

### Estimated Gemini credits: 1-3 attempts (video gen is hit-or-miss)

---

# 📷 IMAGE 2 — Hero Mobile

**Filename:** `hero-mobile.jpg`
**Path:** `frontend/src/assets/images/hero/hero-mobile.jpg`
**Aspect ratio:** 9:16 (1080x1920 pixels) — vertical, optimized for phone screens

### Prompt:

```
A beautiful vertical photograph of a small-to-medium local Pakistani mosque in Sheikhupura, Punjab, captured at golden hour. The composition is portrait/vertical orientation, with the mosque centered and filling most of the frame. White marble dome with golden finial at the top, two minarets visible, intricate blue and green tile work around the main archway. Warm orange sunset sky in the background. A clean marble pathway leads from the bottom of the frame up to the mosque entrance, creating depth and perspective. Lush green grass borders the pathway. The mosque is shot from slightly below center, making the dome appear majestic against the sky. No worshippers visible (this is a clean architectural shot). No text, no watermarks, no logos. Golden hour lighting with warm orange tones. Pakistani Mughal-influenced architecture, NOT Saudi cube style. Shot on iPhone 15 Pro portrait mode, 24mm equivalent, f/2.8. Vertical 9:16 aspect ratio.
```

### Success criteria:
- [ ] Vertical 9:16 aspect ratio (NOT square, NOT landscape)
- [ ] Dome and minarets clearly visible
- [ ] NO people (this is an architectural shot, not a people shot)
- [ ] NO text/watermarks
- [ ] Pathway leading to mosque creates depth

### Estimated Gemini credits: 1-2 generations

---

# 📷 IMAGES 3-8 — Gallery (6 images)

These are displayed in the "Life at [Mosque Name]" carousel on the homepage.

## IMAGE 3 — Gallery Fajr

**Filename:** `gallery-fajr.jpg`
**Path:** `frontend/src/assets/images/gallery/gallery-fajr.jpg`
**Aspect ratio:** 4:3 (800x600)

### Prompt:

```
A beautiful interior photograph of a Pakistani mosque prayer hall during Fajr (dawn) prayer. Soft golden pre-dawn light streams through arched windows on the right side, creating dramatic light rays across the hall. Rows of Pakistani men in white shalwar kameez and prayer caps are in sujood (prostration), forming neat parallel rows on a green carpet with traditional Islamic geometric patterns. The mihrab (prayer niche) is visible at the front with subtle green and gold decoration. The atmosphere is serene, spiritual, contemplative. Warm golden lighting mixed with the cool pre-dawn blue from the windows. Shot from the back of the hall looking toward the mihrab. No faces visible from behind. No text, no watermarks. Photojournalistic style, Canon EOS R5, 35mm lens, f/2.8. Pakistani mosque interior, 4:3 aspect ratio.
```

## IMAGE 4 — Gallery Quran Study Circle

**Filename:** `gallery-quran.jpg`
**Path:** `frontend/src/assets/images/gallery/gallery-quran.jpg`
**Aspect ratio:** 4:3 (800x600)

### Prompt:

```
A warm, intimate photograph of a Quran study circle at a Pakistani mosque. An elderly ustad (teacher) with a white beard, wearing a white shalwar kameez and prayer cap, sits on a green patterned carpet with 3-4 young students around him. He is pointing at an open Quran placed on a wooden rehal (Quran stand) in the center. The students are leaning in attentively, wearing traditional caps. The setting is a simple, well-lit mosque classroom with white walls and arched windows letting in natural daylight. On the wall behind them is a framed Arabic calligraphy verse. The mood is scholarly, focused, intergenerational. Warm natural lighting. No faces fully visible or from the front. No text, no watermarks. Photojournalistic, 35mm lens, 4:3 aspect ratio.
```

## IMAGE 5 — Gallery Madrassa

**Filename:** `gallery-madrassa.jpg`
**Path:** `frontend/src/assets/images/gallery/gallery-madrassa.jpg`
**Aspect ratio:** 4:3 (800x600)

### Prompt:

```
A joyful photograph inside a Pakistani mosque's children's madrassa (Quran school). 5-6 children aged 6-10 are sitting on a colorful patterned carpet, some holding small Quran boards (takhti), others writing Arabic letters on paper. They are wearing traditional prayer caps and colorful shalwar kameez. A young female teacher in a shayla is gently helping one child. Colorful Islamic geometric patterns on the walls. A small whiteboard with Arabic alphabet visible in the background. Natural daylight from a window. The mood is cheerful, innocent, learning. No children facing the camera directly. No text overlays, no watermarks. Warm bright lighting, photojournalistic, 35mm lens, 4:3 aspect ratio.
```

## IMAGE 6 — Gallery Iftar

**Filename:** `gallery-iftar.jpg`
**Path:** `frontend/src/assets/images/gallery/gallery-iftar.jpg`
**Aspect ratio:** 4:3 (800x600)

### Prompt:

```
A vibrant community iftar gathering in the courtyard of a Pakistani mosque at sunset during Ramadan. A long table covered with a white cloth is laden with traditional iftar items: dates, samosas, pakoras, fruit, biryani, and juice boxes. Pakistani men, women in shayla, and children are sitting together on carpets around the table, breaking their fast. The mosque's white marble dome and minarets are visible in the background, glowing in the warm orange sunset. String lights are hung between pillars. The mood is joyful, communal, abundant. Warm sunset lighting. No faces fully visible from front. No text, no watermarks, no logos. Photojournalistic, 35mm lens, 4:3 aspect ratio.
```

## IMAGE 7 — Gallery Nikah

**Filename:** `gallery-nikah.jpg`
**Path:** `frontend/src/assets/images/gallery/gallery-nikah.jpg`
**Aspect ratio:** 4:3 (800x600)

### Prompt:

```
A beautiful, intimate Nikah (Muslim wedding) ceremony in a Pakistani mosque. A bride in an elegant emerald green or maroon traditional bridal outfit with gold embroidery and a delicate dupatta, and a groom in a cream sherwani with a traditional turban, are seated together facing the mosque imam. The imam is reading from a small Quran. Close family members (men on one side, women in shayla on the other) are seated around them on green carpet. The mosque interior has subtle white marble and gold-accented walls. Soft natural light from windows. The mood is sacred, joyful, intimate. No faces visible from front. No text, no watermarks. Photojournalistic, 50mm lens, 4:3 aspect ratio.
```

## IMAGE 8 — Gallery Courtyard Sunset

**Filename:** `gallery-courtyard.jpg`
**Path:** `frontend/src/assets/images/gallery/gallery-courtyard.jpg`
**Aspect ratio:** 4:3 (800x600)

### Prompt:

```
A serene, empty courtyard of a Pakistani mosque at golden hour sunset. The courtyard has a central marble fountain (not running, dry). White marble arches frame the view on all four sides. The central dome is visible above, glowing warm orange in the sunset light. Long shadows stretch across the marble floor. A single pair of leather slippers (jooti) sits by one archway, suggesting a worshipper recently left. Lush green plants in pots along the walls. The mood is peaceful, contemplative, sacred. No people visible. Warm golden hour light. No text, no watermarks. Architectural photography, 24mm wide-angle lens, 4:3 aspect ratio.
```

### Success criteria for ALL 6 gallery images:
- [ ] Consistent white marble + green accents color palette
- [ ] Pakistani people / architecture
- [ ] Natural daylight, no harsh studio lighting
- [ ] NO text, NO watermarks, NO logos
- [ ] Same 4:3 aspect ratio for all
- [ ] Each tells a different "story" (prayer, learning, community, etc.)

### Estimated Gemini credits: 6-12 generations (likely 1-2 per image)

---

# 📷 IMAGES 9-11 — Testimonials (3 images)

These are circular profile photos shown next to quotes in the Testimonials section.

## IMAGE 9 — Testimonial 1 (Young Professional Woman)

**Filename:** `testimonial-1.jpg`
**Path:** `frontend/src/assets/images/testimonials/testimonial-1.jpg`
**Aspect ratio:** 1:1 (400x400)

### Prompt:

```
A professional portrait photo of a young Pakistani woman in her late 20s wearing an elegant modern hijab in soft sage green color, paired with a tailored cream blazer. She has a warm, confident smile. Subtle natural makeup. The background is softly blurred (bokeh) showing an outdoor setting with greenery, suggesting she is near a mosque courtyard. Soft natural daylight. Her face is gently lit from the side. Friendly, approachable, modern. Square 1:1 aspect ratio, portrait orientation, head and shoulders framing. No text, no watermarks. Studio-quality portrait, 85mm lens, f/1.8.
```

## IMAGE 10 — Testimonial 2 (Elderly Man)

**Filename:** `testimonial-2.jpg`
**Path:** `frontend/src/assets/images/testimonials/testimonial-2.jpg`
**Aspect ratio:** 1:1 (400x400)

### Prompt:

```
A dignified portrait of an elderly Pakistani man in his 60s with a full white beard, wearing a traditional white shalwar kameez and a white prayer cap (topi). He has kind, wise eyes and a gentle smile that shows the years of community service. His skin shows the weathered tan of outdoor life. The background shows a softly blurred Pakistani mosque courtyard with white marble arches. Warm natural daylight, slightly backlit creating a halo effect. The mood is grandfatherly, trustworthy, respected. Square 1:1 aspect ratio, portrait orientation, head and shoulders framing. No text, no watermarks. Portrait photography, 85mm lens, f/1.8.
```

## IMAGE 11 — Testimonial 3 (Mother with Daughter)

**Filename:** `testimonial-3.jpg`
**Path:** `frontend/src/assets/images/testimonials/testimonial-3.jpg`
**Aspect ratio:** 1:1 (400x400)

### Prompt:

```
A warm portrait photograph of a Pakistani mother in her mid-30s with her young daughter (around 6-7 years old). The mother is wearing an elegant soft pink shayla and a simple embroidered kurta. The daughter is wearing a colorful traditional shalwar kameez with a small prayer cap. They are both smiling warmly, the mother looking down at her daughter with affection. The background is softly blurred showing the white marble of a Pakistani mosque interior. Warm, natural light from a window. The mood is nurturing, family-oriented, multi-generational. Square 1:1 aspect ratio, portrait orientation, showing both faces. No text, no watermarks. Portrait photography, 85mm lens, f/1.8.
```

### Success criteria for ALL 3 testimonial images:
- [ ] Clear face visible (these ARE meant to be portraits with visible faces)
- [ ] Pakistani people in traditional + modern mix
- [ ] Different ages represented (woman 20s, man 60s, mother 30s with child)
- [ ] Background suggests mosque / community connection
- [ ] Warm, friendly, trustworthy mood
- [ ] NO text, NO watermarks
- [ ] 1:1 square aspect ratio

### Estimated Gemini credits: 3-6 generations (Gemini does portraits well)

---

# 📂 Final Folder Structure (where to save)

```
frontend/src/assets/images/
├── hero/
│   ├── hero-desktop.jpg            # 1920x1080 (16:9) - main background
│   └── hero-mobile.jpg             # 1080x1920 (9:16) - mobile crop
├── gallery/
│   ├── gallery-fajr.jpg
│   ├── gallery-quran.jpg
│   ├── gallery-madrassa.jpg
│   ├── gallery-iftar.jpg
│   ├── gallery-nikah.jpg
│   └── gallery-courtyard.jpg
├── testimonials/
│   ├── testimonial-1.jpg
│   ├── testimonial-2.jpg
│   └── testimonial-3.jpg
└── video/
    └── hero-loop.mp4               # 5-8 second video, 1280x720+
```

---

# 🔄 What Happens After You Generate

1. **Save each file** to its exact path above
2. **Refresh your dev server** (Vite should hot-reload)
3. **Open the homepage** — the new images will appear (once I update the code to use them)
4. **Tell me which look good** and which need regeneration
5. **I give you refined prompts** for any that need work

# 📝 Testimonial Quote Text (for the code)

When I update the Testimonials component, I'll use these realistic quotes (let me know if you want different wording):

- **Testimonial 1 (young woman):** "I never imagined I could book a Nikah service so easily. The mosque team helped my family through every step with such respect and care."
- **Testimonial 2 (elderly man):** "This mosque has been the heart of our community for generations. The new digital system makes it easier for our children to stay connected to the deen."
- **Testimonial 3 (mother):** "My daughter loves her madrassa classes here. The teachers are so patient, and the Quran program has given her a beautiful foundation in Islam."

---

# ✅ Status: Prompts Generated

**Total assets to generate: 11** (1 hero desktop, 1 hero mobile, 1 video, 6 gallery, 3 testimonials)

**Recommended workflow:**
1. Start with **Image 1 (hero-desktop.jpg)** — the most important
2. Once that looks right, generate the rest in any order
3. Show me each result — I'll tell you if it's perfect or needs refinement
4. After all are in place, I update the React code to use them

**Questions?** Just ask. Otherwise, start with the hero image and let me know how it goes!
