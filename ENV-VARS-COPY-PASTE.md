# Render Environment Variables — Copy-Paste Format
**Date:** 2026-04-09  
**Status:** Ready for manual entry into Render dashboard  
**Format:** Each section = one service

---

## 📋 How to Use This File

1. **Get your credentials** (see Credentials Gathering section below)
2. **Replace placeholders** like `[YOUR_FEDEX_CLIENT_ID]` with actual values
3. **Copy-paste each section** into Render dashboard for that service
4. **Do NOT commit this file** after filling in secrets

### Placeholder Legend
```
[YOUR_VALUE]        = You must provide this value
[ALREADY_SET]       = Already configured in blueprint, no change needed
[DO_NOT_CHANGE]     = Pre-configured, leave as-is
```

---

## 🔑 Credentials You Need to Gather

Before entering variables, collect these (keep in secure password manager, don't paste in chat):

### FedEx Credentials
Go to: https://developer.fedex.com
```
FEDEX_CLIENT_ID = [Get from FedEx Developer Portal]
FEDEX_CLIENT_SECRET = [Get from FedEx Developer Portal]
FEDEX_ACCOUNT_NUMBER = [Your FedEx account number]
```

### Supabase Credentials
Go to: https://supabase.com → project (wxctvusgkamzherfqflf) → Settings → API
```
SUPABASE_URL = https://wxctvusgkamzherfqflf.supabase.co [ALREADY KNOWN]
SUPABASE_SERVICE_ROLE_KEY = [Copy from Settings → API → Service role key]
SUPABASE_JWT_SECRET = [Copy from Settings → JWT Settings → JWT secret]
```

### Database Credentials (if not using Supabase PostgreSQL)
```
DATABASE_URL = postgresql://username:password@hostname:5432/database
DATABASE_USERNAME = postgres
DATABASE_PASSWORD = [Your password]
```

**IMPORTANT:** Never paste credentials in shared chat/docs. Use a secure password manager.

---

## Service 1: shipsmart-web (React Frontend)

**Location in Render:** Dashboard → shipsmart-web → Environment

**Copy-paste these (NO CHANGES NEEDED):**

```
VITE_SUPABASE_URL=https://wxctvusgkamzherfqflf.supabase.co
VITE_SUPABASE_ANON_KEY=[ALREADY_SET]
VITE_JAVA_API_BASE_URL=https://shipsmart-api-java.onrender.com
VITE_PYTHON_API_BASE_URL=https://shipsmart-api-python.onrender.com
VITE_APP_ENV=production
VITE_USE_JAVA_QUOTES=true
VITE_USE_JAVA_SAVED_OPTIONS=true
VITE_USE_JAVA_BOOKING_REDIRECT=true
```

**Action:**
- [ ] Verify these are already set in Render (from blueprint)
- [ ] No manual entry needed (blueprint pre-configured)

---

## Service 2: shipsmart-api-java (Spring Boot)

**Location in Render:** Dashboard → shipsmart-api-java → Environment

**You MUST manually add these 6 variables:**

```
DATABASE_URL=postgresql://[YOUR_DB_USERNAME]:[YOUR_DB_PASSWORD]@[YOUR_DB_HOST]:[YOUR_DB_PORT]/[YOUR_DB_NAME]

DATABASE_USERNAME=[YOUR_DATABASE_USERNAME]

DATABASE_PASSWORD=[YOUR_DATABASE_PASSWORD]

SUPABASE_URL=https://wxctvusgkamzherfqflf.supabase.co

SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

SUPABASE_JWT_SECRET=[YOUR_SUPABASE_JWT_SECRET]
```

**Example (filled in, do NOT use these values):**
```
DATABASE_URL=postgresql://postgres:mypassword123@db.example.com:5432/shipsmart
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=mypassword123
SUPABASE_URL=https://wxctvusgkamzherfqflf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=super-secret-jwt-token-here
```

**Action:**
- [ ] Go to Render → shipsmart-api-java
- [ ] Click **Environment** tab
- [ ] Click **Add Environment Variable** 6 times (once for each line above)
- [ ] Paste key (before `=`), then value (after `=`)
- [ ] Click **Save**

---

## Service 3: shipsmart-api-python (FastAPI)

**Location in Render:** Dashboard → shipsmart-api-python → Environment

**You MUST manually add these 3 variables:**

```
FEDEX_CLIENT_ID=[YOUR_FEDEX_CLIENT_ID]

FEDEX_CLIENT_SECRET=[YOUR_FEDEX_CLIENT_SECRET]

FEDEX_ACCOUNT_NUMBER=[YOUR_FEDEX_ACCOUNT_NUMBER]
```

**Example (filled in, do NOT use these values):**
```
FEDEX_CLIENT_ID=abcd1234efgh5678ijkl9012
FEDEX_CLIENT_SECRET=xyz9876543210fedcba1234567890abcd
FEDEX_ACCOUNT_NUMBER=123456789
```

**Action:**
- [ ] Go to Render → shipsmart-api-python
- [ ] Click **Environment** tab
- [ ] Click **Add Environment Variable** 3 times
- [ ] Paste credentials from FedEx Developer Portal
- [ ] Click **Save**

---

## Service 4: shipsmart-mcp-tools (MCP Tools Server)

**Location in Render:** Dashboard → shipsmart-mcp-tools → Environment

**You MUST manually add these 3 variables (same FedEx credentials):**

```
FEDEX_CLIENT_ID=[YOUR_FEDEX_CLIENT_ID]

FEDEX_CLIENT_SECRET=[YOUR_FEDEX_CLIENT_SECRET]

FEDEX_ACCOUNT_NUMBER=[YOUR_FEDEX_ACCOUNT_NUMBER]
```

**Note:** These should be the SAME values as Service 3 (shipsmart-api-python).

**Example (filled in, do NOT use these values):**
```
FEDEX_CLIENT_ID=abcd1234efgh5678ijkl9012
FEDEX_CLIENT_SECRET=xyz9876543210fedcba1234567890abcd
FEDEX_ACCOUNT_NUMBER=123456789
```

**Action:**
- [ ] Go to Render → shipsmart-mcp-tools
- [ ] Click **Environment** tab
- [ ] Click **Add Environment Variable** 3 times
- [ ] Paste SAME FedEx credentials as Service 3
- [ ] Click **Save**

---

## Summary: What Goes Where

| Service | Variables to Add | Count | Secured? |
|---------|------------------|-------|----------|
| shipsmart-web | None (pre-configured) | 0 | ✅ |
| shipsmart-api-java | Database + Supabase | 6 | 🔐 YES |
| shipsmart-api-python | FedEx | 3 | 🔐 YES |
| shipsmart-mcp-tools | FedEx | 3 | 🔐 YES |
| **TOTAL** | | **12** | |

---

## Quick Checklist: Before You Start

- [ ] You have FedEx credentials (from developer.fedex.com)
- [ ] You have Supabase credentials (from supabase.com)
- [ ] You have database connection details (if not using Supabase PostgreSQL)
- [ ] You're logged into Render dashboard (https://render.com)
- [ ] You're in the ShipSmart project
- [ ] You can see all 4 services listed

---

## What NOT to Do

❌ **DO NOT:**
- Commit this file with real credentials to GitHub
- Share credentials in Slack/email/chat
- Use placeholder values (like `[YOUR_]`) in the actual Render dashboard
- Set sync: true for secret variables
- Reuse old/expired credentials

✅ **DO:**
- Keep credentials in a secure password manager (1Password, LastPass, etc.)
- Enter credentials directly into Render dashboard (not in this file)
- Use the same FedEx credentials for both api-python and mcp-tools
- Verify each variable was saved after entering

---

## Troubleshooting: "Variable Not Saved"

If a variable doesn't save in Render:

1. **Check format:** Should be `KEY=VALUE` (no extra spaces)
2. **Check length:** Some values are very long (Supabase keys) — make sure you copied the whole thing
3. **Check special characters:** If value has `=`, `&`, or `$`, that's OK
4. **Try copying one char at a time:** Paste, then verify each character
5. **Refresh page:** Sometimes Render UI needs a refresh

---

## Next Steps After Entering Variables

Once all variables are entered in Render:

1. **Restart services** (each service has a "Restart" button)
   - Restart order: api-java → api-python → mcp-tools → web
2. **Watch for "Live" status** (green indicator)
3. **Run verification scripts** (I'll provide these)
4. **Test in Claude Code** (verify tools are discoverable)

---

## Copy-Paste Order (Recommended)

**When you go to Render, follow this order to avoid mistakes:**

1. ⏱️ **Timer: 1 minute**
   - Go to shipsmart-web
   - Verify pre-configured variables (no action needed)

2. ⏱️ **Timer: 10 minutes**
   - Go to shipsmart-api-java
   - Add 6 variables (Database + Supabase)
   - Click Save

3. ⏱️ **Timer: 3 minutes**
   - Go to shipsmart-api-python
   - Add 3 variables (FedEx)
   - Click Save

4. ⏱️ **Timer: 3 minutes**
   - Go to shipsmart-mcp-tools
   - Add 3 variables (FedEx, same as api-python)
   - Click Save

5. ⏱️ **Timer: 2 minutes**
   - Restart all 4 services (in order above)

**Total time: ~20 minutes**

---

## Format Verification

Before pasting into Render, verify:

- [ ] No leading/trailing spaces
- [ ] Each variable on its own line
- [ ] Format is exactly: `KEY=VALUE`
- [ ] No quotes around values (unless value itself has quotes)
- [ ] Special characters like `@`, `-`, `_`, `/` are fine
- [ ] Long values (Supabase keys) are complete

---

**Version:** 1.0  
**Date:** 2026-04-09  
**Status:** Ready for manual entry into Render dashboard
