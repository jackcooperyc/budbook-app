import type { LearnArticle } from '@/types/learn';

/** Built-in seed pack so Learn is never empty on first visit. */
export const SEED_LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: 'start-low-go-slow',
    title: 'Start Low, Go Slow',
    summary:
      'A practical dosing primer for flower, edibles, and concentrates — how to find your floor before you chase a ceiling.',
    category: 'Harm reduction',
    tags: ['dosing', 'beginners', 'safety'],
    published_at: '2026-01-15T12:00:00.000Z',
    updated_at: '2026-01-15T12:00:00.000Z',
    body: `## Why pacing matters

Cannabis effects vary widely by product, method, and you. THC potency on a label is only one signal — tolerance, empty stomach, and set/setting all change the ride.

**Start low, go slow** means: take a small first dose, wait long enough to feel it, then decide whether more makes sense.

## Flower and vapor

- One or two light inhalations is enough for most new or returning consumers.
- Wait **10–15 minutes** before another hit; peak effects often arrive after you think they will.
- Keep a glass of water nearby and a quiet place to sit if you feel overstimulated.

## Edibles

Edibles are easy to overdo because onset is delayed.

- Begin with **2.5–5 mg THC** if you are new or sensitive.
- Wait **at least 2 hours** before redosing. Many people wait longer.
- Fat in a meal can change absorption; do not “stack” doses because the first one “isn’t working yet.”

## Concentrates

Dabs and high-potency carts hit fast and hard. If you are new to concentrates, treat them as advanced — use a tiny amount, or stick with flower until you know your response.

## If you overdid it

Effects fade. Sit or lie down, hydrate, breathe slowly, and avoid more cannabis. CBD-dominant products sometimes soften the edge for some people, but they are not a guaranteed antidote. Seek medical help if you have severe symptoms or cannot keep yourself safe.

## Bottom line

Your journal in Pacs.MT is a good place to note dose, method, and how you felt afterward. Patterns beat guesswork.
`,
  },
  {
    slug: 'reading-a-coa',
    title: 'How to Read a Lab Report (COA)',
    summary:
      'What a Certificate of Analysis actually tells you — cannabinoids, contaminants, and which fields matter for stash decisions.',
    category: 'Lab literacy',
    tags: ['coa', 'lab', 'compliance'],
    published_at: '2026-02-01T12:00:00.000Z',
    updated_at: '2026-02-01T12:00:00.000Z',
    body: `## What a COA is

A **Certificate of Analysis** is a lab document for a specific batch or sample. Retail menus and package labels often summarize results; the COA is the fuller record.

Pacs.MT’s scanner path uses COA data (when available) to populate authoritative terpenes and cannabinoid percentages in your stash.

## Core sections to scan

### Cannabinoids

Look for **THC**, **THCA**, **CBD**, **CBDA**, and sometimes minors (CBG, CBN). Units are usually **% by weight** or **mg/g**.

- For flower, total THC is often estimated from THCA + THC (labs use a conversion factor).
- Compare the batch ID or sample ID on the COA to what’s on the package when you can.

### Terpenes

Terpene panels list dominant aromatics (myrcene, limonene, beta-caryophyllene, etc.). Profiles help explain aroma and, for some people, subjective effects — they are not medical claims.

### Contaminants

A useful COA also reports **pass/fail** (or quantified results) for:

- Pesticides
- Heavy metals
- Microbial impurities
- Residual solvents (especially for extracts)

If a contaminant panel is missing, treat potency-only sheets as incomplete for safety decisions.

## Red flags

- No lab name, date, or sample identifier
- Results that look copy-pasted across unrelated products
- Potency claims far outside typical ranges without explanation

## Using COAs in Pacs.MT

Scan or paste a COA URL when possible so Registry and stash entries share a consistent \`product_key\` and lab report ID. That keeps your journal tied to the same chemistry over time.
`,
  },
  {
    slug: 'terpenes-and-effects',
    title: 'Terpenes and Subjective Effects',
    summary:
      'A grounded look at common terpenes, what aroma notes suggest, and why “strain type” alone is a weak predictor.',
    category: 'Education',
    tags: ['terpenes', 'effects', 'strains'],
    published_at: '2026-02-20T12:00:00.000Z',
    updated_at: '2026-02-20T12:00:00.000Z',
    body: `## Beyond indica / sativa labels

Indica and sativa are useful shorthand for plant morphology and marketing, but **chemistry** (cannabinoids + terpenes) is a better lens for what you might feel. Two “indica” jars can smell and hit very differently.

## Common terpenes you will see

| Terpene | Often smells like | Notes people report |
| --- | --- | --- |
| Myrcene | Earthy, musky, herbal | Relaxed body feel for some |
| Limonene | Citrus peel | Bright, uplifted mood for some |
| Beta-caryophyllene | Pepper, spice | Warm, grounding; interacts with CB2 in research contexts |
| Linalool | Floral, lavender | Calming associations for some |
| Pinene | Pine, forest | Alert / clear-headed for some |
| Humulene | Woody, hops | Earthy backbone in many profiles |

These are **patterns and associations**, not guarantees. Dose, method, and your state matter more than any single terpene.

## How to use this in practice

1. Note the top 2–3 terpenes on a COA when you try something new.
2. Log mood, pain, and anxiety before/after in your journal.
3. Over a few sessions, look for repeats — not one-off miracles.

## Entourage is not magic

“Entourage effect” describes the idea that compounds work together. It is a research hypothesis and a useful mental model, not a license for absolute claims. Stay curious, stay measured.
`,
  },
  {
    slug: 'set-and-setting',
    title: 'Set and Setting for Cannabis',
    summary:
      'Mindset and environment shape the experience as much as milligrams. Practical habits for safer, more intentional sessions.',
    category: 'Harm reduction',
    tags: ['mindset', 'environment', 'safety'],
    published_at: '2026-03-05T12:00:00.000Z',
    updated_at: '2026-03-05T12:00:00.000Z',
    body: `## What “set and setting” means

Borrowed from psychedelic harm-reduction language:

- **Set** — your mindset, expectations, stress level, and intentions
- **Setting** — who you are with, where you are, and what you might need

Cannabis is not a classic psychedelic for most people at typical doses, but the same idea still helps: an anxious night in a loud crowd hits differently than a calm evening on the couch.

## Before you consume

- Eat something light if you tend to get lightheaded.
- Decide your **ceiling dose** ahead of time (especially for edibles).
- Tell a trusted friend if you are trying a new high-potency product.
- Clear a path to water, a bathroom, and a place to sit or lie down.

## During

- Avoid stacking alcohol and high-THC products until you know your response.
- If anxiety rises, change the setting: quieter room, slower breathing, lower lights, familiar music.
- Do not drive or operate machinery while impaired. Plan a ride or stay put.

## After

Log the session while details are fresh. Pacs.MT’s before/after scores make it easier to notice which products and contexts work for you — and which to skip next time.
`,
  },
  {
    slug: 'tolerance-and-breaks',
    title: 'Tolerance, Breaks, and Resetting',
    summary:
      'Why the same dose stops hitting the same way, and how short breaks or lower-potency swaps can help without drama.',
    category: 'Education',
    tags: ['tolerance', 'breaks', 'habits'],
    published_at: '2026-03-18T12:00:00.000Z',
    updated_at: '2026-03-18T12:00:00.000Z',
    body: `## Tolerance is normal

With frequent use, your response to THC often dampens. People chase the old effect by raising dose — which can raise side effects and cost without restoring the original experience.

## Signs it may be time to adjust

- You need noticeably more to feel anything
- Desired effects feel flat, but next-day fog or irritability is worse
- Cannabis is crowding out sleep, appetite, or plans you care about

## Practical resets

There is no single correct schedule. Common approaches:

- **Short break** (a few days to a couple of weeks) — many people notice sensitivity return
- **Lower-potency swap** — flower or balanced CBD:THC instead of concentrates
- **Method change** — vapor or edible timing that forces slower pacing
- **Intentional days off** — build non-use nights into the week

If you use cannabis for medical reasons, talk with a clinician before changing a regimen that works for you.

## Use your journal

Track dose and ratings across a break. The point is not perfection — it is noticing whether less (or different) gives you more of what you actually want.
`,
  },
];
