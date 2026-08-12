# Source Data Inventory

## 1. `src/data/destinations.ts`
- **File Path**: `keyabroad-app/src/data/destinations.ts`
- **Record Count**: 16 destinations (countries)
- **Fields**: 
  - `id` (string, acts as slug)
  - `name` (string)
  - `image` (string, path)
  - `about` (string, description)
  - `universities` (Array of `{ name: string, url: string }`)
  - `courses` (Array of strings)
  - `whyChoose` (Array of strings)
  - `flagCode` (string)
  - `wavingFlagImage` (string, optional)
  - `wavingFlagStyle` (string, optional)
- **Relationships**:
  - `universities` are nested inside each destination. (Approx 120 universities total).
  - `courses` are nested inside each destination, representing programs. (Approx 6-8 per country).
  - `whyChoose` are bullet points for country features.
- **Duplicate Candidates**: None within the `destinations.ts` file itself (all IDs are unique). Universities might have name variations (e.g. "University of Toronto (UofT)").
- **Missing Fields**: 
  - Universities lack `logo_url`, `id`, `slug`.
  - Courses lack `degree_level`, `tuition_fee`, `duration`.
- **Data Quality Issues**:
  - Courses are generic strings (e.g. "Health/Science") rather than specific degree programs.
  - Some universities have placeholder URLs (`#`).
  - No real program data exists (just generic categories).
  - No scholarship data exists.

## 2. `src/data/languageTests.ts`
- **File Path**: `keyabroad-app/src/data/languageTests.ts`
- **Record Count**: Needs verification (likely IELTS/PTE structures).
- **Data Quality**: This is likely static content for marketing pages, not relational database content.

## 3. Sub-destination files (`src/data/destinations/*.ts`)
- **File Path**: `keyabroad-app/src/data/destinations/dubai.ts`, etc.
- **Data Quality**: These seem to be duplicates or expanded versions of the main `destinations.ts` file. Need to be merged or deprecated.
