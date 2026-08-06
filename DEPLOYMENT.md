# Keyabroad Full Deployment & Publishing Guide

This document contains everything you need to know to deploy your system to the internet, connect your custom domains, update the database, and publish your code to GitHub. Keep this file handy as your "Cheat Sheet" whenever you want to make updates!

---

## 1. Deploying the Main Website (`keyabroad-app`)

Whenever you make changes to the main public website (like updating images, changing text, or adding new features), you need to tell Vercel to publish the new version.

1. Open your terminal in VS Code.
2. Make sure you are inside the website folder:
   ```bash
   cd C:\Users\DeLL\OneDrive\Desktop\Keyabroad\keyabroad-app
   ```
3. Run the Vercel Production deployment command:
   ```bash
   npx vercel --prod
   ```
4. Wait for it to say `✓ Generating static pages`. As soon as it finishes, your live website is officially updated!

---

## 2. Deploying the Admin Dashboard (`keyabroad-admin`)

Whenever you make changes to the private employee dashboard, you need to deploy it separately so that the main website's speed isn't affected.

1. Open your terminal in VS Code.
2. Switch to the admin folder:
   ```bash
   cd C:\Users\DeLL\OneDrive\Desktop\Keyabroad\keyabroad-admin
   ```
3. Run the forced Vercel Production deployment command (the `--force` flag ensures your Environment Variables are freshly pulled):
   ```bash
   npx vercel --prod --force
   ```
4. Click the green `Production` link it gives you to view the live dashboard.

---

## 3. Adding New Admins / Employees (Database)

Because the Admin Dashboard is highly secure, people cannot just "sign up". They must be manually added to the system by you. 

**Step A: Create their Login (Auth)**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) -> `Keyabroad` project.
2. Click **Authentication** (the people icon).
3. Click **Add user** -> **Create new user**.
4. Enter their email, a temporary password, check "Auto Confirm", and click Create.

**Step B: Add to the Team Directory (Database)**
1. In the Supabase Dashboard, click **Table Editor** (the spreadsheet icon).
2. Click the **`employees`** table.
3. Click the green **Insert row** button in the top right.
4. Fill in their exact Auth email, their Name, Role, etc.
5. Click **Save**. They can now successfully log in!

---

## 4. Connecting Custom Domains (Vercel + Hostinger)

If you ever buy a new domain name, here is how to connect it:
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard), click your project, and go to **Settings -> Domains**.
2. Type in your domain (e.g., `www.yourdomain.com`) and hit Add.
3. Vercel will give you a **CNAME** or **A Record** (like `76.76.21.21` or `vercel-dns.com`).
4. Log into Hostinger (or GoDaddy/Namecheap), open your DNS Settings.
5. Delete any existing `www` or `@` records that conflict.
6. Add the new record exactly as Vercel provided.
7. *Wait 15-30 minutes, open an Incognito Window, and your domain is live!*

---

## 5. Publishing to GitHub (Your Portfolio)

To keep your resume/portfolio updated with your latest code:
1. Open the **GitHub Desktop** app on your computer.
2. The app will automatically detect any files you've changed.
3. In the bottom-left "Summary" box, type what you changed (e.g., "Updated home page images").
4. Click the blue **Commit to main** button.
5. Click the blue **Push origin** button at the top of the screen.
6. Your new code is instantly published to your GitHub profile!

*(Note: Never upload your `.env.local` files to GitHub. The GitHub Desktop app automatically reads your `.gitignore` files to keep your Supabase database completely safe from hackers!)*
