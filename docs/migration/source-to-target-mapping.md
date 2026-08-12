# Source to Target Mapping

## Target Database Schema (Phase 2)
The database structure is defined in `migrations/003_core_catalog.sql`.
- **`countries`**: `id`, `name`, `slug`, `description`, `image_url`, `flag_code`, `waving_flag_image`, `waving_flag_style`
- **`country_features`**: `id`, `country_id`, `feature`
- **`universities`**: `id`, `country_id`, `name`, `slug`, `url`, `logo_url`, `commission_structure`
- **`programs`**: `id`, `university_id`, `name`, `degree_level`, `tuition_fee`, `currency`, `duration`
- **`scholarships`**: `id`, `university_id`, `country_id`, `name`, `amount`, `currency`, `description`, `deadline`

---

## 1. Destination (Country) Mapping
| Source Field | Target Table | Target Column | Transformation | Validation |
| :--- | :--- | :--- | :--- | :--- |
| `destination.name` | `countries` | `name` | Trim whitespace | Required |
| `destination.id` | `countries` | `slug` | Lowercase + URL-safe | Required, Unique |
| `destination.about` | `countries` | `description` | String cast | Optional |
| `destination.image` | `countries` | `image_url` | String cast | Optional |
| `destination.flagCode` | `countries` | `flag_code` | String cast | Optional |
| `destination.wavingFlagImage` | `countries` | `waving_flag_image` | String cast | Optional |
| `destination.wavingFlagStyle` | `countries` | `waving_flag_style` | String cast | Optional |

## 2. Why Choose (Features) Mapping
| Source Field | Target Table | Target Column | Transformation | Validation |
| :--- | :--- | :--- | :--- | :--- |
| `destination.whyChoose[i]` | `country_features` | `feature` | Trim whitespace | Required |
| `(derived)` | `country_features` | `country_id` | Foreign Key lookup by `destination.slug` | Required |

## 3. Universities Mapping
| Source Field | Target Table | Target Column | Transformation | Validation |
| :--- | :--- | :--- | :--- | :--- |
| `university.name` | `universities` | `name` | Trim whitespace | Required |
| `university.name` | `universities` | `slug` | `slugify(university.name)` + unique suffix if duplicate | Required, Unique |
| `university.url` | `universities` | `url` | Standardize URI (null if `#`) | Optional |
| `(derived)` | `universities` | `country_id` | Foreign Key lookup by `destination.slug` | Required |

## 4. Courses (Programs) Mapping
*Note: The source data has generic "Course Category" strings rather than real programs. We will migrate them as generic foundation programs to maintain data continuity.*

| Source Field | Target Table | Target Column | Transformation | Validation |
| :--- | :--- | :--- | :--- | :--- |
| `course (string)` | `programs` | `name` | Trim whitespace | Required |
| `(derived)` | `programs` | `university_id` | Foreign Key lookup by `university.slug` | Required |
| `(derived)` | `programs` | `degree_level` | Hardcode to `bachelors` as placeholder | Required |
| `(derived)` | `programs` | `tuition_fee` | Hardcode to `null` | Optional |

## 5. Discarded Fields
- None. All fields in `destinations.ts` are mapped to the normalized Supabase schema.
