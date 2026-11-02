# SHOP Template — Supabase-powered digital SHOP

A rebrandable frontend starter. You can deploy it to Netlify, Vercel, or any static host.

## Quick setup

1. Create a new Supabase project at https://supabase.com/.
2. Open **Project Settings → API** and copy the Project URL and anon/publishable key.
3. Open `config.js` and replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY`.
   **Never paste a service_role or secret key into frontend code.**
4. In Supabase, open **SQL Editor → New query**, paste the complete `supabase/schema.sql`, and click Run. This creates the required tables, functions, triggers, storage bucket, and row-level security policies.
5. Deploy the entire folder to a static host. For Netlify, drag the folder into the deploy area or connect a Git repository.
6. In Supabase → Authentication → URL Configuration, set your deployed URL as the Site URL and add these Redirect URLs:
   - `https://YOUR-SITE.netlify.app/**`
   - `https://YOUR-SITE.netlify.app/update-password.html`
7. Register using your website. Confirm your email if confirmation is enabled.
8. Promote your account to admin using the Supabase SQL Editor (replace the email):
   ```sql
   update public.profiles set is_admin = true where email = 'you@example.com';
   ```
9. Sign in again, open Admin, and configure your SHOP name, logo, payment details, products, variants, and inventory.

## Important

- Each user must create and use their own Supabase project and hosting account.
- The browser app uses only the Supabase anon/publishable key. Never expose a service-role/secret key.
- Run `supabase/schema.sql` in a new/empty project for a clean setup. It also contains migration statements and should not be blindly run against a production database without a backup.
- This template uses manual UPI/QR funding. An admin must verify payments before approving top-ups. Automatic payment confirmation requires a payment gateway and secure server-side webhook.
- Review Supabase Auth email settings and your hosting provider's current deployment instructions before launch.


## Developer credit
This template includes a small developer credit footer: **Developed by THEBLUEX**, linking to [YouTube](https://www.youtube.com/@GAMING_XBM2K) and [Telegram](https://t.me/GAMING_XBM2K_All_MODS). Please keep this attribution in place when sharing or using the template.
