# Storage Architecture

Supabase Storage will manage all binary assets via specific buckets.

## Buckets

### 1. `student-documents` (Private)
- **Purpose**: Passports, transcripts, financial statements.
- **Security**: Strictly private.
- **Access**: Only accessible via signed URLs generated on the server after verifying the user is the owner or an authorized counselor.

### 2. `university-assets` (Public)
- **Purpose**: Logos, campus photos, brochures.
- **Security**: Public read, Admin write.
- **Access**: Direct public URLs. Cached aggressively on the CDN.

### 3. `blog-media` (Public)
- **Purpose**: Images for the CMS.
- **Security**: Public read, Content Manager write.

### 4. `avatars` (Public)
- **Purpose**: Staff and student profile pictures.
- **Security**: Public read, self-write.

## Optimization
- Use Next.js `<Image>` component to request WebP/AVIF formats and appropriate sizing from the Supabase image transformation API.
