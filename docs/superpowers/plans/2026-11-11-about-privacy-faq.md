# About Us Redesign, Privacy Policy, and FAQ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the About Us page into a minimal and elegant presentation, implement full Privacy Policy and FAQ pages from the source documents, and interconnect them in the Footer and About Us scene.

**Architecture:** Next.js App Router pages (`app/about`, `app/privacy`, `app/faq`) delegating to scene components (`scenes/about`, `scenes/privacy`, `scenes/faq`) following existing repo patterns. Privacy Policy features a sticky sidebar table of contents for legal navigation; FAQ features category filters, search input, and smooth accessible accordions; Footer and About Us are updated with reciprocal links.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS v4, Lucide React icons, Sonner toast notifications.

**Spec:** User prompt instructions + `docs/سیاست و حریم خصوصی.docx` + `docs/سوالات متداول.pdf`.

## Global Constraints

- Design language: Minimalist, clean, calm, without exaggerated gradients, multi-colored saturated cards, or neon glow blobs.
- Color system: Strict adherence to `app/globals.css` semantic tokens (`--primary`: #202D3E, `--accent`: #14B8A6, `--surface`: #FFFFFF, `--background-subtle`: #F8FAFC, `--border`: #D8DEE7).
- Typography: Clean Persian typography, correct RTL layout, Persian numerals where appropriate.
- Responsive design: Full mobile, tablet, and desktop fidelity.
- Build integrity: Passes TypeScript compilation (`npx tsc --noEmit`).

## Review Focus

1. Mobile responsiveness for FAQ category navigation and search.
2. Privacy Policy Table of Contents active highlighting and smooth scrolling on both desktop and mobile.
3. Link integrity between Footer, About Us, Privacy Policy, and FAQ.
4. Minimal aesthetic consistency on About Us avoiding visual clutter or loud gradients.
5. Search filtering performance and Persian character normalization in FAQ.

---

### Task 1: Redesign About Us Page (`scenes/about/index.tsx`)

**Files:**
- Modify: `scenes/about/index.tsx`
- Modify: `app/about/page.tsx`

**Interfaces:**
- Consumes: `Footer` from `@/components/layout/Footer`, `toPersianDigits` from `@/lib/utils`, Lucide icons.
- Produces: Clean, minimal `AboutScene` default component.

- [ ] **Step 1: Refactor Hero & Narrative Sections**
Replace loud 5-color gradients and oversized glowing background blobs with a clean, light, typography-focused hero: subtle border, calm navy text, clear mission statement, and understated action pills.

- [ ] **Step 2: Streamline Values & Audience Grids**
Refactor the 4 core values into a unified minimal card system (neutral surface, delicate borders, subtle hover transitions, single accent color) and simplify the 4 audience segments into clean, balanced cards.

- [ ] **Step 3: Refine Contact & Office Section**
Organize contact numbers and office address into a clean, unified card layout with one-click copy buttons and maps routing.

- [ ] **Step 4: Add Trust & Legal Navigation Links**
Add a dedicated, minimal quick-access section linking to:
  - شرایط و مقررات (`/rules`)
  - سیاست و حریم خصوصی (`/privacy`)
  - سوالات متداول (`/faq`)

- [ ] **Step 5: Verify Typecheck & Visual Cleanliness**
Run `npx tsc --noEmit` and verify no TypeScript issues exist.

---

### Task 2: Implement Privacy Policy Page (`scenes/privacy/index.tsx` & `app/privacy/page.tsx`)

**Files:**
- Create: `scenes/privacy/index.tsx`
- Modify: `app/privacy/page.tsx`

**Interfaces:**
- Consumes: Full text from `docs/سیاست و حریم خصوصی.docx` (all 6 sections: مقدمه, اطلاعات و دسترسی‌ها, اهداف پردازش, اشتراک‌گذاری, امنیت و نگهداری, حقوق کاربر, اطلاعات تماس).
- Produces: `PrivacyScene` component with sticky sidebar TOC, clean prose typography, and smooth section navigation.

- [ ] **Step 1: Extract and Structure Privacy Policy Content**
Parse all articles and sub-clauses from `docs/سیاست و حریم خصوصی.docx` into structured, clean React components with clear headings, badges, and callout blocks.

- [ ] **Step 2: Build `scenes/privacy/index.tsx`**
Implement the page with:
  - Breadcrumb navigation (`صفحه اصلی` > `سیاست‌نامه حریم خصوصی`).
  - Minimalist legal header with last-update badge (01/08/1405).
  - Sticky Table of Contents sidebar for desktop with smooth scrolling.
  - Formatted content cards with clear visual hierarchy, bullet lists, and summary callouts.
  - Official contact details card with direct links.
  - Linked `Footer`.

- [ ] **Step 3: Update `app/privacy/page.tsx`**
Point `app/privacy/page.tsx` to `scenes/privacy` instead of the temporary `scenes/rules`.

- [ ] **Step 4: Verify Compilation**
Run `npx tsc --noEmit` to confirm no errors.

---

### Task 3: Implement FAQ Page (`scenes/faq/index.tsx` & `app/faq/page.tsx`)

**Files:**
- Create: `scenes/faq/index.tsx`
- Create: `app/faq/page.tsx`

**Interfaces:**
- Consumes: All 10 sections from `docs/سوالات متداول.pdf`.
- Produces: `FaqScene` component with search query state, active category filter, and accessible accordions.

- [ ] **Step 1: Structure FAQ Data**
Extract all questions and answers across the 10 sections from `docs/سوالات متداول.pdf`:
  1. آشنایی با ملک تودی
  2. ثبت‌نام و حساب کاربری
  3. جست‌وجو و مشاهده آگهی‌ها
  4. ثبت آگهی ملک
  5. سوالات ویژه مشاوران و دفاتر املاک
  6. بخش کاوش و محتوای تخصصی
  7. پروژه‌های ساختمانی و اطلاعات تخصصی ملک
  8. پرداخت، تعرفه‌ها و خدمات مالی
  9. پشتیبانی و رفع مشکلات
  10. امنیت، حریم خصوصی و اعتماد

- [ ] **Step 2: Build `scenes/faq/index.tsx` Component**
Implement the FAQ scene with:
  - Real-time search filter with Persian text normalization.
  - Category selector tabs/pills with question counts.
  - Smooth collapsible accordion for questions and answers.
  - Empty state when no questions match the search query.
  - Support contact banner at the bottom ("پاسخ سوال خود را نیافتید؟ تماس با پشتیبانی").
  - Linked `Footer`.

- [ ] **Step 3: Create `app/faq/page.tsx`**
Create Next.js page route with Persian SEO metadata (`title: "سوالات متداول | ملک تودی"`).

- [ ] **Step 4: Verify Compilation**
Run `npx tsc --noEmit` to ensure no errors.

---

### Task 4: Update Footer & About Us Links (`components/layout/Footer.tsx`)

**Files:**
- Modify: `components/layout/Footer.tsx`
- Modify: `scenes/about/index.tsx`

**Interfaces:**
- Updates navigation links to include `/privacy` and `/faq`.

- [ ] **Step 1: Add Links to Footer**
In `components/layout/Footer.tsx`:
  - In column "خدمات و راهنما": add links to `/faq` (سوالات متداول) and `/privacy` (حریم خصوصی).
  - In the bottom copyright bar: add `/privacy` (حریم خصوصی) and `/faq` (سوالات متداول) alongside `/about` and `/rules`.

- [ ] **Step 2: Cross-verify Links in About Us**
Ensure the Quick Links section in `scenes/about/index.tsx` links to:
  - `/rules` (قوانین و مقررات)
  - `/privacy` (سیاست و حریم خصوصی)
  - `/faq` (سوالات متداول)

- [ ] **Step 3: Run Full Project Build & Verification**
Run `npx tsc --noEmit` and Next.js build verification to guarantee zero syntax, type, or lint errors.
