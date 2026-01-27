# How to Deploy: Complete Guide

This guide covers everything needed to deploy the "Chat with LLM" application from scratch, including technology overview, step-by-step instructions, and comparison with alternative deployment methods.

---

## Technologies Used

### WebLLM (MLC-AI)
[WebLLM](https://github.com/mlc-ai/web-llm) is a high-performance JavaScript library that enables running large language models directly in the browser. It uses **WebGPU** for hardware acceleration, achieving up to 80% of native performance. Models are compiled using the Machine Learning Compilation (MLC) framework and quantized to 4-bit precision to reduce memory requirements. This allows models like Llama 3.2 and Qwen3 to run entirely client-side without any server infrastructure.

### WebGPU
WebGPU is the next-generation graphics and compute API for the web, replacing WebGL for GPU-accelerated tasks. It provides low-level access to GPU hardware, enabling efficient matrix operations required for neural network inference. Browser support includes Chrome 113+, Edge 113+, and Safari 17.4+.

### Firebase Platform
[Firebase](https://firebase.google.com) is Google's Backend-as-a-Service (BaaS) platform. We use three services:

| Service | Purpose |
|---------|---------|
| **Firebase Hosting** | Global CDN for static files with custom headers support |
| **Firebase Authentication** | Anonymous user authentication (no email required) |
| **Cloud Firestore** | NoSQL database for chat history synchronization |

Firebase was chosen because it provides all three services in one integrated platform, with a generous free tier and excellent developer experience.

### Why This Stack?

1. **Privacy-First**: AI runs in browser, not on servers
2. **Zero Backend Code**: Firebase handles auth and database
3. **Global Performance**: CDN distributes static files worldwide
4. **Cost-Effective**: Free tier covers most use cases
5. **Security**: Firestore rules enforce user data isolation

---

## Prerequisites

Before starting, ensure you have:

- [ ] **Node.js** (v18 or higher) - [Download](https://nodejs.org)
- [ ] **Google Account** - For Firebase Console access
- [ ] **Modern Browser** - Chrome 113+, Edge 113+, or Safari 17.4+
- [ ] **Git** - For version control (optional but recommended)

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
# Should show v13.x.x or higher
```

---

## Step 1: Create Firebase Project

### 1.1 Access Firebase Console

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Create a project"** (or "Add project")
3. Enter project name: `ai-chat-in-your-tab`
4. Disable Google Analytics (not needed for this app)
5. Click **"Create project"**

### 1.2 Register Web App

1. In project overview, click the **Web icon** (`</>`)
2. Enter app nickname: `AI Chat Web`
3. Check **"Also set up Firebase Hosting"**
4. Click **"Register app"**
5. **Copy the firebaseConfig object** - you'll need this later:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ai-chat-in-your-tab.firebaseapp.com",
  projectId: "ai-chat-in-your-tab",
  storageBucket: "ai-chat-in-your-tab.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 1.3 Enable Authentication

1. In left sidebar, go to **Build** > **Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Click **"Anonymous"**
5. Toggle **Enable** to ON
6. Click **Save**

### 1.4 Create Firestore Database

1. In left sidebar, go to **Build** > **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose a location (select one close to your users)
5. Click **"Enable"**

---

## Step 2: Configure Local Project

### 2.1 Update Firebase Config

Edit `public/firebase-config.js` and replace placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",           // From step 1.2
  authDomain: "ai-chat-in-your-tab.firebaseapp.com",
  projectId: "ai-chat-in-your-tab",
  storageBucket: "ai-chat-in-your-tab.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",     // From step 1.2
  appId: "YOUR_APP_ID"                     // From step 1.2
};
```

### 2.2 Login to Firebase CLI

```bash
firebase login
```

This opens a browser for Google authentication.

### 2.3 Initialize Project (if needed)

If `.firebaserc` doesn't exist or points to wrong project:

```bash
firebase use ai-chat-in-your-tab
```

Or reinitialize:
```bash
firebase init
# Select: Hosting, Firestore
# Use existing project: ai-chat-in-your-tab
# Public directory: public
# Single-page app: No
# Overwrite files: No
```

---

## Step 3: Deploy

### 3.1 Deploy Everything

```bash
cd /path/to/llm_in_browser
firebase deploy
```

This deploys:
- Static files to Firebase Hosting
- Security rules to Firestore

### 3.2 Deploy Specific Services

```bash
# Only hosting (website files)
firebase deploy --only hosting

# Only Firestore rules
firebase deploy --only firestore:rules
```

### 3.3 Verify Deployment

After deployment, you'll see:
```
✔ Deploy complete!

Hosting URL: https://ai-chat-in-your-tab.web.app
```

Open the URL to test your deployed app.

---

## Step 4: Test Locally (Optional)

### Using Python
```bash
cd public
python -m http.server 8000
# Open http://localhost:8000
```

### Using Firebase Emulators
```bash
firebase emulators:start
# Opens local versions of Hosting, Auth, and Firestore
```

### Using Node.js
```bash
npx serve public
# Open http://localhost:3000
```

---

## Why Firebase Hosting?

We chose Firebase Hosting over alternatives for several specific reasons:

### The Critical Requirement: Custom HTTP Headers

This application requires special HTTP headers for WebLLM/WebGPU to work:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers enable `SharedArrayBuffer`, which WebLLM uses for multi-threaded model inference. **Not all hosting platforms support custom headers on their free tiers.**

### Comparison with Alternatives

| Platform | Custom Headers | Database | Auth | Free Tier | Best For |
|----------|---------------|----------|------|-----------|----------|
| **Firebase** | ✅ Yes | ✅ Firestore | ✅ Built-in | 10GB hosting | Full-stack apps |
| **Vercel** | ✅ Yes | ❌ External | ❌ External | Limited commercial | Next.js apps |
| **Netlify** | ✅ Yes (via _headers) | ❌ External | ❌ External | 100GB bandwidth | JAMstack sites |
| **GitHub Pages** | ❌ No | ❌ No | ❌ No | Unlimited (public) | Documentation |
| **Cloudflare Pages** | ✅ Yes | ❌ External | ❌ External | Unlimited | Static + Workers |

### Why Not Other Platforms?

#### GitHub Pages
- **Pros**: Free, simple, great for open source
- **Cons**: No custom headers support, no backend services
- **Verdict**: Would work for the LLM part if we removed COOP/COEP requirements, but no database for chat history

#### Vercel
- **Pros**: Excellent DX, great for Next.js, edge functions
- **Cons**: Commercial use restrictions on free tier, need external database
- **Verdict**: Good choice if you're building with Next.js and don't need integrated auth/database

#### Netlify
- **Pros**: Generous free tier (100GB), plugin ecosystem, custom headers via `_headers` file
- **Cons**: No integrated database, need external auth
- **Verdict**: Strong alternative if you only need hosting + custom headers

#### Cloudflare Pages
- **Pros**: Unlimited bandwidth, Workers for edge compute, D1 database
- **Cons**: Steeper learning curve, newer platform
- **Verdict**: Excellent choice for high-traffic sites, but Firebase is simpler for this use case

### Firebase Advantages for This Project

1. **All-in-One**: Hosting + Auth + Database in single platform
2. **Custom Headers**: Full control via `firebase.json`
3. **Anonymous Auth**: Perfect for privacy-focused app (no email required)
4. **Real-time Sync**: Firestore syncs chat across devices automatically
5. **Security Rules**: Server-enforced data access control
6. **Free Tier**: Sufficient for personal/small-scale use
7. **Google Cloud Integration**: Easy to scale if needed

---

## Project Structure

```
llm_in_browser/
├── public/                      # Deployed to Firebase Hosting
│   ├── index.html              # Main HTML
│   ├── app.js                  # Application logic
│   ├── styles.css              # Styles
│   ├── memory.js               # Context management
│   ├── firebase-config.js      # Firebase credentials (gitignored)
│   ├── firebase-config.example.js  # Template for config
│   └── db.js                   # Firestore operations
├── firebase.json               # Hosting + Firestore config
├── .firebaserc                 # Project alias
├── firestore.rules             # Database security rules
├── .gitignore                  # Excludes firebase-config.js
├── README.md                   # Project documentation
├── MODELS.md                   # Available models info
└── how_to_deploy.md            # This file
```

---

## Troubleshooting

### "Permission denied" during deploy
```bash
firebase login --reauth
```

### "Project not found"
```bash
firebase projects:list
firebase use YOUR_PROJECT_ID
```

### CORS errors in browser
Ensure `firebase.json` has the COOP/COEP headers configured (already done in this project).

### "Anonymous auth not enabled"
Go to Firebase Console > Authentication > Sign-in method > Enable Anonymous.

### Firestore permission denied
Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

### Model fails to load
- Check browser supports WebGPU: [webgpureport.org](https://webgpureport.org)
- Ensure enough disk space for model cache (~500MB-2GB)
- Try a smaller model first (Qwen3 0.6B)

---

## Cost Considerations

### Firebase Free Tier (Spark Plan)

| Service | Free Limit |
|---------|------------|
| Hosting | 10 GB storage, 360 MB/day transfer |
| Firestore | 1 GB storage, 50K reads/day, 20K writes/day |
| Authentication | Unlimited anonymous users |

For a personal project or small user base, you'll likely never exceed these limits.

### Paid Tier (Blaze Plan)

If you exceed free limits:
- Hosting: $0.026/GB storage, $0.15/GB transfer
- Firestore: $0.18/GB storage, $0.06/100K reads

Firebase Blaze is pay-as-you-go with no minimum.

---

## Next Steps After Deployment

1. **Custom Domain**: Add your own domain in Firebase Console > Hosting
2. **Monitoring**: Enable Firebase Performance Monitoring
3. **Analytics**: Add Firebase Analytics if needed
4. **Backup**: Set up Firestore automated backups
5. **CI/CD**: Use GitHub Actions for automatic deploys

---

## Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [WebLLM GitHub](https://github.com/mlc-ai/web-llm)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [WebGPU Compatibility](https://webgpureport.org)

---

*Last updated: January 2026*
