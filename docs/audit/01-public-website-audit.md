# Public Website Audit (keyabroad-app)

## Overview
- **URL**: https://www.keyabroad.com
- **Purpose**: Public-facing lead generation, student portal login, destination discovery, and brand credibility.
- **Framework**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion

## Sitemap & Page Analysis

### 1. Homepage (`/`)
* **Purpose**: Primary landing page, conversion funnel entry.
* **Components**: Hero section, Destination Slider, Key Experience stats, Multi-step Enquiry Form (Wizard), ICEF Certification badge, Reviews carousel, Contact CTA.
* **CTA**: "Apply Now", "Free Consultation"
* **Forms**: `EnquiryFormWizard` (7 steps)
* **Weaknesses**: Hardcoded destination data; UI uses basic Tailwind without a robust component library; Enquiry form lacks Zod validation.
* **Recommended Replacement**: Rebuild using shadcn/ui components; pull dynamic destination data from Supabase; implement strict form validation via React Hook Form.

### 2. Destinations Hub (`/destinations`)
* **Purpose**: Showcase study destinations.
* **Components**: Grid of country cards.
* **Weaknesses**: Driven by a static TypeScript array (`src/data/destinations.ts`) rather than the database; limits scalability and content management.
* **Recommended Replacement**: Database-driven destination pages with dynamic filtering (budget, language, region).

### 3. Destination Detail (`/destinations/[country]`)
* **Purpose**: Provide details on specific countries (UK, USA, Australia, etc.).
* **Components**: Country overview, universities list, requirements.
* **Weaknesses**: Universities are hardcoded in the frontend.
* **Recommended Replacement**: Fully dynamic pages mapped to a relational database schema (Countries -> Universities -> Programs).

### 4. Blog (`/blog`)
* **Purpose**: Content marketing and SEO.
* **Data Source**: Fetches from Supabase `blogs` table.
* **Weaknesses**: Basic rendering; lacks advanced SEO metadata and Schema.org structured data.
* **Recommended Replacement**: Enhance with rich text rendering, MDX support, and dynamic structured data.

### 5. Other Static Pages (`/about`, `/services`, `/counseling`, `/language-tests`, `/teams`)
* **Purpose**: Information and trust building.
* **Weaknesses**: Hardcoded content that requires developer intervention to update.
* **Recommended Replacement**: Integrate with a lightweight CMS module in the admin panel to allow marketing staff to update content.

### 6. Student Portal Login (`/student`, `/login`)
* **Purpose**: Entry points for students and staff.
* **Weaknesses**: `/student` currently uses a mock login (`setTimeout` redirect) with no actual authentication. `/login` redirects to the admin app.
* **Recommended Replacement**: Full Supabase Auth integration with secure session handling via Next.js middleware.

## Global Issues
- **Duplicate Pages**: `/walk-in` and the homepage enquiry form overlap in purpose.
- **SEO Problems**: Missing canonical URLs, missing sitemaps (`sitemap.xml`), missing `robots.txt`, and lack of structured data.
- **Mobile Problems**: Some complex UI components (like the form wizard) are clunky on small screens.
- **Accessibility**: Missing ARIA labels, suboptimal color contrast in certain areas.
