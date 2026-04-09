# Credentials Gathering Guide
**Date:** 2026-04-09  
**Status:** Instructions for gathering secrets (do NOT store here)

---

## 🔑 Secrets You Need to Gather

Before starting deployment, collect these credentials. **Store them in a secure password manager, NOT in this file or GitHub.**

### Credential Types

| Type | Count | Required For | Priority |
|------|-------|--------------|----------|
| FedEx | 3 values | api-python, mcp-tools | ⭐⭐⭐ CRITICAL |
| Supabase | 2 values | api-java | ⭐⭐⭐ CRITICAL |
| Database | 3 values | api-java | ⭐⭐ (if not using Supabase) |

---

## 1. FedEx Credentials (3 values)

### Where to Get Them
- **URL:** https://developer.fedex.com
- **Time:** 5-10 minutes
- **Account:** You need a FedEx business account

### What You'll Get

```
FEDEX_CLIENT_ID
FEDEX_CLIENT_SECRET
FEDEX_ACCOUNT_NUMBER
```

### Step-by-Step

1. **Go to FedEx Developer Portal**
   ```
   https://developer.fedex.com
   ```

2. **Sign in with your FedEx account**
   - If you don't have one, create at https://www.fedex.com

3. **Navigate to API Keys section**
   - Look for: "My Apps" or "Applications"
   - Click "Create New Application"

4. **Create or select an application**
   - Application name: `ShipSmart` (or your choice)
   - Click "Create"

5. **Copy credentials**
   - You'll see: **API Key** (this is `FEDEX_CLIENT_ID`)
   - You'll see: **Secret Key** (this is `FEDEX_CLIENT_SECRET`)
   - Copy both to secure password manager

6. **Get your FedEx Account Number**
   - Go to your FedEx account page
   - Look for: "Account Number" or "Account ID"
   - Usually in profile settings
   - Copy to secure password manager

### Verification
- FEDEX_CLIENT_ID: Alphanumeric string, usually 20+ characters
- FEDEX_CLIENT_SECRET: Alphanumeric string, usually 30+ characters
- FEDEX_ACCOUNT_NUMBER: Numeric, usually 9-12 digits

### ⚠️ Important

- [ ] Never commit these to GitHub
- [ ] Never share in email/Slack
- [ ] Store only in password manager (1Password, LastPass, Bitwarden, etc.)
- [ ] Rotate every 90 days in production

---

## 2. Supabase Credentials (2 values)

### Where to Get Them
- **URL:** https://supabase.com
- **Project:** wxctvusgkamzherfqflf (already known)
- **Time:** 2-3 minutes

### What You'll Get

```
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
```

### Note: You Already Know

```
SUPABASE_URL = https://wxctvusgkamzherfqflf.supabase.co (already in render.yaml)
```

### Step-by-Step

1. **Go to Supabase**
   ```
   https://supabase.com
   ```

2. **Sign in with your account**
   - You already have access to wxctvusgkamzherfqflf project

3. **Navigate to Project Settings**
   - Click on project name in sidebar
   - Click **Settings** (gear icon)

4. **Go to API tab**
   - Look for section: "API Keys"

5. **Copy Service Role Key**
   - Look for: "Service role" key (marked as `secret`)
   - Copy to secure password manager
   - This is `SUPABASE_SERVICE_ROLE_KEY`

6. **Copy JWT Secret**
   - Go to **Settings** → **Auth** (or **JWT Settings**)
   - Look for: "JWT secret" or "Signing secret"
   - Copy to secure password manager
   - This is `SUPABASE_JWT_SECRET`

### Verification
- SUPABASE_SERVICE_ROLE_KEY: Starts with `eyJhbGc...`, very long (100+ chars)
- SUPABASE_JWT_SECRET: Alphanumeric, usually 32+ characters

### ⚠️ Important

- [ ] Service role key is powerful — guard it carefully
- [ ] Never commit to GitHub
- [ ] Never share in email/Slack
- [ ] Store only in password manager

---

## 3. Database Credentials (3 values) — Optional

### Only If You're NOT Using Supabase PostgreSQL

If you're using:
- [ ] External PostgreSQL server
- [ ] Render PostgreSQL instance
- [ ] Other database provider

Then collect:

```
DATABASE_URL = postgresql://username:password@hostname:5432/database
DATABASE_USERNAME = postgres (or your username)
DATABASE_PASSWORD = your_password
```

### Where to Get Them

**Option A: From Render PostgreSQL** (if you created one)
- Go to https://render.com → Databases
- Click your database
- Copy connection string

**Option B: From your own PostgreSQL**
- Ask your database admin
- Or check your connection string

**Option C: Not needed**
- If you're using Supabase, skip this section
- DATABASE_URL will point to Supabase

### Format

```
DATABASE_URL should look like:
postgresql://user:password@hostname.com:5432/dbname

Example:
postgresql://postgres:mypassword123@db.postgresql.render.com:5432/shipsmart
```

### Verification
- Starts with `postgresql://`
- Contains username, password, hostname, port, database name
- All parts are present

### ⚠️ Important

- [ ] Password is in the URL — guard it carefully
- [ ] Never commit to GitHub
- [ ] Never share in email/Slack
- [ ] Consider rotating password monthly

---

## Quick Checklist: Before Deployment

Create a secure note in your password manager with:

```
Deployment Day Credentials
──────────────────────────────────────────

FedEx:
  CLIENT_ID: [paste here]
  CLIENT_SECRET: [paste here]
  ACCOUNT_NUMBER: [paste here]

Supabase:
  SERVICE_ROLE_KEY: [paste here]
  JWT_SECRET: [paste here]

Database (if needed):
  URL: [paste here]
  USERNAME: [paste here]
  PASSWORD: [paste here]

DO NOT SHARE THIS NOTE.
DO NOT COMMIT TO GITHUB.
DELETE AFTER DEPLOYMENT (or keep in password manager).
```

---

## Deployment Day: Using Credentials

When you're ready to deploy:

1. **Open `ENV-VARS-COPY-PASTE.md`**
   ```
   /c/Users/ashis/OneDrive/Documents/ShipSmart/ENV-VARS-COPY-PASTE.md
   ```

2. **Replace placeholders with values from password manager**
   - Replace `[YOUR_FEDEX_CLIENT_ID]` with actual value
   - Replace `[YOUR_SUPABASE_SERVICE_ROLE_KEY]` with actual value
   - etc.

3. **Copy-paste into Render dashboard**
   - DO NOT save the filled-in file to GitHub
   - Use temporary copy on your local machine only

4. **Delete temporary copy after pasting**
   - Don't keep filled-in credentials on disk
   - Keep credentials only in password manager

---

## Security Best Practices

### ✅ DO

- [ ] Store credentials in a password manager (1Password, LastPass, Bitwarden)
- [ ] Use strong, unique passwords
- [ ] Enable 2FA on Render, FedEx, Supabase accounts
- [ ] Rotate credentials every 90 days
- [ ] Keep credentials separate from code
- [ ] Use environment variables in deployment
- [ ] Log who accessed credentials and when
- [ ] Delete temporary copies after use

### ❌ DO NOT

- [ ] Store credentials in plain text files
- [ ] Share credentials via email, Slack, GitHub
- [ ] Commit credentials to version control
- [ ] Use the same credentials for dev and production
- [ ] Leave credentials visible on your screen
- [ ] Use temporary credentials long-term
- [ ] Share credentials with unnecessary team members

---

## Troubleshooting: Credentials

### Issue: "Invalid FedEx credentials"

**Possible causes:**
1. Credentials are for sandbox, not production
2. Credentials expired
3. Credentials are URL-encoded (have `%` symbols)
4. Typo in copy-paste

**Fix:**
1. Double-check credentials from FedEx portal
2. Ensure using production keys, not sandbox
3. Copy credentials fresh (don't use cached version)
4. Verify no extra spaces or newlines

---

### Issue: "Invalid Supabase credentials"

**Possible causes:**
1. Copied wrong key (anon key instead of service role key)
2. Service role key is disabled
3. Typo in copy-paste
4. Spaces or newlines in key

**Fix:**
1. Verify you copied SERVICE ROLE KEY (not anon key)
2. Check Supabase dashboard — key should be enabled
3. Copy fresh from Supabase settings
4. Remove any extra spaces/newlines

---

### Issue: "Cannot connect to database"

**Possible causes:**
1. DATABASE_URL format is wrong
2. Database username/password is incorrect
3. Database hostname is unreachable
4. Database doesn't exist

**Fix:**
1. Verify format: `postgresql://user:pass@host:5432/db`
2. Test connection locally: `psql "postgresql://user:pass@host:5432/db"`
3. Check database is running and accessible
4. Verify database name exists

---

## Credential Rotation (Monthly)

Once deployed, rotate credentials monthly:

1. **FedEx:**
   - Go to https://developer.fedex.com
   - Regenerate API key
   - Update in Render → Environment
   - Restart service

2. **Supabase:**
   - Go to https://supabase.com → Settings → API
   - Rotate service role key
   - Update in Render → Environment
   - Restart service

3. **Database:**
   - Change password in database
   - Update DATABASE_URL in Render
   - Restart service

---

## Emergency: Credentials Leaked

If a credential is exposed:

1. **Immediately revoke it:**
   - FedEx: Regenerate API key
   - Supabase: Rotate service role key
   - Database: Change password

2. **Update Render:**
   - Go to service → Environment
   - Update with new credential
   - Restart service

3. **Audit logs:**
   - Check if credential was used unauthorized
   - Review Render logs
   - Check FedEx API logs

4. **Notify team:**
   - Let team know credential rotation occurred
   - No action needed on their part

---

## Summary

| Credential | Count | Effort | Security |
|-----------|-------|--------|----------|
| FedEx | 3 | 5 min | High |
| Supabase | 2 | 3 min | High |
| Database | 3 | 3 min | Critical |
| **TOTAL** | **8** | **~11 min** | **Keep safe!** |

---

## Next Steps

1. **Gather credentials** (following this guide)
2. **Store in password manager** (1Password, LastPass, etc.)
3. **Open `ENV-VARS-COPY-PASTE.md`** when ready to deploy
4. **Follow `DEPLOYMENT-DAY-RUNBOOK.md`** to deploy

---

**Version:** 1.0  
**Date:** 2026-04-09  
**Status:** Ready for credential gathering
