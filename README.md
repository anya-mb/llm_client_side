# Chat with LLM - 100% Private

A privacy-first AI chat application where **everything runs in your browser**. No servers process your prompts. No API keys required. No monthly fees.

Your conversations stay on your device — the AI runs locally using WebGPU.

## Why This Exists

Every prompt you send to ChatGPT, Claude, or Gemini travels to someone else's servers. Your questions, your ideas, your code — stored, logged, potentially used for training.

This project proves there's another way: **client-side AI inference** that keeps your data yours.

## Features

| Category | What You Get |
|----------|--------------|
| **Privacy** | AI runs 100% in-browser via WebLLM. Prompts never leave your device. |
| **Authentication** | Anonymous sign-in — no email, phone, or personal info required. |
| **Sync** | Chat history syncs across devices via Firebase (your messages, not AI processing). |
| **Models** | 6 LLMs from 0.6B to 3.8B parameters — pick speed or quality. |
| **Context** | Smart summarization keeps conversations going beyond model limits. |
| **UX** | Dark/light mode, multiple chats, export to JSON, streaming responses. |

## Available Models

| Model | Size | Speed | Best For |
|-------|------|-------|----------|
| Qwen3 0.6B | 0.6B | Fastest | Quick Q&A, older hardware |
| Llama 3.2 1B | 1B | Very Fast | Balanced everyday use |
| SmolLM2 1.7B | 1.7B | Fast | Code and math |
| Gemma 2 2B | 2B | Moderate | Factual accuracy |
| Llama 3.2 3B | 3B | Moderate | Complex conversations |
| Phi-3.5 Mini | 3.8B | Slower | Best reasoning |

See [MODELS.md](MODELS.md) for detailed specs and recommendations.

## Quick Start

### Requirements
- Modern browser: Chrome 113+, Edge 113+, or Safari 17.4+
- WebGPU support ([check here](https://webgpureport.org))

### Deploy Your Own (5 minutes)

```bash
# Clone
git clone <repo-url>
cd llm_in_browser

# Configure Firebase (see below)
# Edit public/firebase-config.js with your credentials

# Deploy
npm install -g firebase-tools
firebase login
firebase deploy
```

### Firebase Setup

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → **Anonymous** sign-in
3. Create **Firestore Database** in production mode
4. Copy config to `public/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. Deploy: `firebase deploy`

Full walkthrough: [Deployment Guide](medium_post/how_to_deploy_the_same_05.md)

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                     YOUR BROWSER                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   WebLLM    │───▶│   WebGPU    │───▶│  Response   │ │
│  │  (Model)    │    │   (GPU)     │    │ (Streaming) │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                                      │        │
│         ▼                                      ▼        │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Chat UI + History                   │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
└──────────────────────────│──────────────────────────────┘
                           │ (sync only)
                           ▼
                    ┌─────────────┐
                    │  Firebase   │
                    │ (Firestore) │
                    └─────────────┘
```

**Key insight:** Firebase syncs your chat history, but your prompts are never processed by external servers. The LLM runs on your GPU.

## Project Structure

```
llm_in_browser/
├── public/
│   ├── index.html          # Main app
│   ├── app.js              # Application logic + WebLLM
│   ├── styles.css          # UI styling
│   ├── memory.js           # Context management + summarization
│   ├── firebase-config.js  # Your Firebase credentials
│   └── db.js               # Firestore operations
├── medium_post/            # Blog series (5 parts)
├── firebase.json           # Hosting config + security headers
├── firestore.rules         # Database security rules
├── MODELS.md               # Detailed model documentation
├── FIRESTORE_STRUCTURE.md  # Database schema
├── SECURITY_REPORT.md      # Security audit findings
└── how_to_deploy.md        # Deployment deep-dive
```

## Documentation

| Document | Description |
|----------|-------------|
| [MODELS.md](MODELS.md) | Model specs, VRAM requirements, use cases |
| [FIRESTORE_STRUCTURE.md](FIRESTORE_STRUCTURE.md) | Database schema and query patterns |
| [SECURITY_REPORT.md](SECURITY_REPORT.md) | Security audit with findings and fixes |
| [how_to_deploy.md](how_to_deploy.md) | Complete deployment guide |

## Blog Series

Learn how this project works in our 5-part series:

1. **[Project Overview](medium_post/llm_client_side_01.md)** — Why browser-based AI matters
2. **[LLM Comparison](medium_post/llm_details_02.md)** — Choosing the right model
3. **[Firebase Deep Dive](medium_post/firebase_details_03.md)** — Anonymous auth + Firestore
4. **[Security Analysis](medium_post/security_details_04.md)** — Our audit findings
5. **[Deployment Guide](medium_post/how_to_deploy_the_same_05.md)** — Step-by-step setup

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 113+ | Full support |
| Edge | 113+ | Full support |
| Safari | 17.4+ | Full support (macOS 14.4+) |
| Firefox | 121+ | Requires flags |

Check WebGPU: [webgpureport.org](https://webgpureport.org)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model won't load | Check WebGPU support, try smaller model |
| Slow generation | Use smaller model, close GPU-heavy apps |
| Firebase errors | Verify config, enable Anonymous Auth |
| "Permission denied" | Deploy Firestore rules: `firebase deploy --only firestore:rules` |

## Tech Stack

- **[WebLLM](https://github.com/mlc-ai/web-llm)** — Browser-based LLM inference
- **[WebGPU](https://www.w3.org/TR/webgpu/)** — GPU compute in browsers
- **[Firebase](https://firebase.google.com)** — Auth, Firestore, Hosting
- **[MLC-AI](https://mlc.ai/)** — Model compilation and quantization

## Cost

| Usage | Monthly Cost |
|-------|--------------|
| Personal use | $0 (Firebase free tier) |
| Heavy use | Pay-as-you-go (Firebase Blaze) |
| AI inference | $0 (runs on your GPU) |

## License

Open source. Model licenses apply from their respective providers (Meta, Google, Microsoft, Alibaba, Hugging Face).

---

**The future of AI isn't just more powerful models — it's who controls the compute.**

With browser-based AI, the answer is: you do.
