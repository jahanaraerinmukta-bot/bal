# জনতার কণ্ঠ — নিরাপদ অভিযোগ ওয়েবসাইটের Starter

এই starter একটি **শুরু করার ভিত্তি**, সম্পূর্ণ নিরাপত্তা-পরীক্ষিত বা সরকারি অনুমোদনপ্রাপ্ত সিস্টেম নয়। iPhone Safari দিয়ে GitHub/Replit-এর browser editor ব্যবহার করে ফাইলগুলো আপলোড/এডিট করা যাবে; প্রথম setup কম্পিউটারে সহজ, তবে বাধ্যতামূলক নয়।

## নিরাপত্তার নকশা
- অভিযোগ প্রথমে `complaint_submissions`-এ private থাকে।
- Admin যাচাই করে আলাদা `public_complaints` টেবিলে সংক্ষিপ্ত, পরিচয়মুক্ত পোস্ট প্রকাশ করে।
- Public website কখনো private submission table পড়তে পারে না।
- Admin access: Supabase Auth + `ADMIN_EMAILS` allowlist; service-role key শুধু server environment-এ।
- প্রথম সংস্করণে attachment upload বন্ধ রাখা হয়েছে। এতে EXIF metadata/অজান্তে পরিচয় ফাঁসের ঝুঁকি কমে।
- Anonymous মানে শতভাগ অশনাক্তযোগ্য নয়: hosting, network provider, browser ও server logs থেকে কিছু তথ্য থাকতে পারে। কাউকে জরুরি বিপদে থাকলে website-এর বদলে স্থানীয় জরুরি সেবা নিতে বলুন।

## 1) Supabase
1. https://supabase.com এ project তৈরি করুন।
2. SQL Editor-এ `supabase/schema.sql` পুরোটা চালান।
3. Project Settings → API থেকে Project URL, anon/publishable key, service_role/secret key সংগ্রহ করুন। service_role key কখনো browser code বা public repository-তে দেবেন না।
4. Authentication → Providers-এ Email provider চালু রাখুন; public sign-up বন্ধ করুন (admin account আপনি Dashboard থেকে invite/create করবেন)।
5. Authentication → URL Configuration-এ আপনার deployed URL যোগ করুন।

## 2) Environment variables
`.env.example` কপি করে `.env.local` নামে রাখুন এবং values বসান:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ADMIN_EMAILS` — admin-এর email, comma-separated
- `SITE_URL` — deployed website URL

কোনো secret-ই `NEXT_PUBLIC_` prefix দিয়ে রাখবেন না।

## 3) Run / Deploy
এটি Next.js App Router project. Node.js 20.9+ environment-এ:
```bash
npm install
npm run dev
```
তারপর `http://localhost:3000`। deploy করতে GitHub-এ repository push করে Vercel-এ Import করুন, Framework = Next.js দিন, Environment Variables বসিয়ে Deploy করুন। iPhone-এ Safari দিয়ে GitHub/Replit/Vercel dashboard ব্যবহার করা যায়, তবে code edit করা তুলনামূলক কঠিন হতে পারে।

## 4) Admin
- Supabase Dashboard → Authentication → Users থেকে admin user তৈরি/invite করুন।
- ওই account-এর email `ADMIN_EMAILS`-এ থাকতে হবে।
- `/admin`-এ লগইন করে pending অভিযোগ দেখা, reject করা বা পরিচয়মুক্ত public post publish করা যাবে। প্রকাশিত পোস্ট edit করা, Recycle Bin-এ পাঠানো, restore করা এবং Trash থেকে permanently delete করার সুবিধাও আছে। Permanently delete শুধু Trash-এ থাকা পোস্টের জন্য কাজ করে।
- Admin-এর published text অবশ্যই হাতে যাচাই করতে হবে। অভিযোগ সত্য প্রমাণিত হয়েছে এমন দাবি করবেন না; wording-এ “অভিযোগ” বলুন।
- অভিযোগের status বা reference code-কে তদন্ত/সরকারি গ্রহণের প্রমাণ হিসেবে দেখাবেন না।

## 5) Admin edit / Recycle Bin
- Supabase SQL Editor-এ আপডেট করা `supabase/schema.sql` চালান; এটি পুরোনো টেবিলে `updated_at` ও `deleted_at` column-ও যোগ করে।
- `/admin`-এ প্রকাশিত পোস্টের সারাংশ edit করে Save করা যায়। Delete button পোস্টটিকে soft-delete করে; public homepage-এ আর দেখায় না।
- Recycle Bin থেকে Restore করলে পোস্ট আবার public হয়। Permanently Delete করলে public copy মুছে যায়; private original submission রাখা হয় এবং তার status rejected করে public-post reference পরিষ্কার করা হয়।
- শুধু Supabase-এ authenticated user এবং `ADMIN_EMAILS` allowlist-এ থাকা Admin server actions চালাতে পারবেন। Service-role key server-only রাখুন।

## 6) Go-live-এর আগে বাধ্যতামূলক কাজ
- বাংলাদেশি আইনজীবীর পরামর্শে privacy notice, retention/deletion policy, terms ও defamation risk review।
- একটি নির্ভরযোগ্য moderation team এবং report/takedown process।
- Rate limiting, bot protection (যেমন managed challenge), security monitoring এবং backup policy যোগ করুন।
- Admin-দের জন্য শক্তিশালী unique password ও MFA ব্যবহার করুন।
- `public_complaints`-এ ব্যক্তির নাম/ফোন/ঠিকানা/জাতীয় পরিচয়পত্র/সুনির্দিষ্ট বাড়ির ঠিকানা প্রকাশ করবেন না।
- এই starter-এ upload, direct authority integration, email notification, captcha, rate limiting এবং formal complaint tracking অন্তর্ভুক্ত নয়।

## ছবি আপলোড ও Share buttons (নতুন)
- অভিযোগ জমা দেওয়ার ফর্মে ঐচ্ছিক JPG/PNG/WebP ছবি যোগ করা যায়; সর্বোচ্চ ৫ MB।
- ছবিগুলো private Supabase Storage bucket `complaint-images`-এ রাখা হয়। শুধু server-side service-role ব্যবহার করে আপলোড/পড়া হয়; Admin pending অভিযোগে signed URL দিয়ে ছবি দেখে যাচাই করতে পারবেন।
- Admin প্রকাশ করার সময় ছবির path public post-এ কপি হয়; Public homepage শুধু প্রকাশিত পোস্টের ছবির signed URL তৈরি করে।
- প্রতিটি প্রকাশিত পোস্টে WhatsApp, Facebook share এবং Instagram/অন্যান্য অ্যাপে শেয়ার করার জন্য লিংক কপি বাটন আছে। Instagram ওয়েবসাইট থেকে সরাসরি পোস্ট share URL দেয় না, তাই কপি করা লিংক Instagram DM/Story-তে ব্যবহার করতে হবে।
- Supabase SQL Editor-এ `supabase/migrations/20261029_recycle_bin.sql` চালাতে হবে। এতে image_path কলাম এবং private Storage bucket তৈরি/আপডেট হবে।
- `.env.local`-এ `SITE_URL`-এ live website-এর সম্পূর্ণ origin দিতে হবে, যেমন `https://your-domain.example`।
- Public launch-এর আগে managed rate limiting/CAPTCHA, image moderation, EXIF metadata stripping এবং abuse reporting যোগ করার পরামর্শ দেওয়া হচ্ছে।
