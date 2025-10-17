# 🔐 Security & Environment Variables Guide

## ⚠️ CRITICAL: Never Commit Secret Keys!

This project uses environment variables to keep sensitive information (API keys, database credentials, etc.) **OUT of the codebase**.

## 📝 File Structure

```
SAFE TO COMMIT (Examples only):
✅ .env.example
✅ .env.production.example
✅ backend/.env.example

NEVER COMMIT (Contains real secrets):
❌ .env
❌ .env.local
❌ .env.production
❌ .env.development
❌ backend/.env
❌ backend/.env.production
```

All `.env*` files (except `.example` files) are in `.gitignore` and will **NOT be pushed to GitHub**.

---

## 🚀 Setup Instructions

### For Local Development

1. **Frontend** - Copy the example file:
   ```bash
   cp .env.production.example .env.local
   ```

2. **Backend** - Copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

3. **Fill in your actual API keys** in the `.env` files (NOT the .example files!)

4. **Verify files are ignored**:
   ```bash
   git status
   ```
   You should NOT see `.env` or `.env.production` files listed!

---

## 🌐 Production Deployment

### Railway (Backend)

**DO NOT** upload `.env.production` file to Railway!

Instead, add environment variables in Railway's dashboard:

1. Go to your project in Railway
2. Click **"Variables"** tab
3. Click **"Raw Editor"**
4. Paste your variables (values only, not the file!)
5. Click **"Deploy"**

### Netlify (Frontend)

**DO NOT** upload `.env.production` file to Netlify!

Instead, add environment variables in Netlify's dashboard:

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add each variable:
   - `VITE_API_URL`
   - `GEMINI_API_KEY`
4. Click **"Deploy site"**

---

## 🔑 Where to Get API Keys

| Service | Purpose | Get Key From |
|---------|---------|--------------|
| **MongoDB Atlas** | Database | https://www.mongodb.com/cloud/atlas |
| **Cloudinary** | Image/Video uploads | https://console.cloudinary.com |
| **Gemini AI** | AI features | https://aistudio.google.com/app/apikey |
| **Resend** | Email newsletters | https://resend.com |
| **JWT Secret** | Authentication | Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

---

## ✅ Security Checklist

Before pushing to GitHub:

- [ ] All `.env` files are in `.gitignore`
- [ ] Run `git status` - NO `.env` files should appear
- [ ] Only `.env.example` files are committed
- [ ] All sensitive keys are replaced with placeholders in example files
- [ ] Production keys are added in Railway/Netlify dashboards (NOT in code)

---

## 🆘 What If I Accidentally Committed Secrets?

**If you accidentally pushed API keys to GitHub:**

1. **Immediately revoke/regenerate ALL exposed keys**:
   - MongoDB: Create new database user with new password
   - Cloudinary: Reset API credentials
   - Gemini: Delete and create new API key
   - Resend: Delete and create new API key
   - JWT_SECRET: Generate new secret

2. **Remove secrets from Git history**:
   ```bash
   # Remove file from Git history
   git rm --cached .env.production
   git rm --cached backend/.env.production
   
   # Commit the removal
   git commit -m "Remove environment files from tracking"
   
   # Push changes
   git push origin main
   ```

3. **Update `.gitignore` and verify**:
   ```bash
   git status  # Should show no .env files
   ```

4. **Update Railway/Netlify with new keys**

---

## 📚 Additional Resources

- [GitHub - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Railway - Environment Variables](https://docs.railway.app/develop/variables)
- [Netlify - Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

## 🤝 Contributing

If you're contributing to this project:

1. **NEVER commit your personal API keys**
2. Use `.env.example` files as templates
3. Add new environment variables to `.env.example` files (with placeholder values)
4. Document new variables in this file

---

**Remember: Treat API keys like passwords - NEVER share them publicly!**
