# Chat with LLM - 100% Private

A fully client-side AI chat application that runs language models entirely in your browser. Your conversations never leave your device - all AI inference happens locally using WebGPU.

## Features

### Privacy & Security
- **100% Client-Side AI** - Models run entirely in your browser via WebLLM
- **No Data to Servers** - Your prompts and conversations stay on your device
- **Anonymous Authentication** - No email or personal info required
- **Secure Cloud Sync** - Chat history synced via Firebase with user-only access

### AI Capabilities
- **6 Model Options** - From fast 0.6B to powerful 3.8B parameter models
- **Smart Context Management** - Automatic summarization prevents context overflow
- **Streaming Responses** - Watch AI generate responses in real-time
- **Model Switching** - Change models on the fly

### User Experience
- **Chat History** - All conversations saved and synced
- **Multiple Chats** - Create and manage separate conversations
- **Dark/Light Mode** - Theme toggle for comfortable viewing
- **Responsive Design** - Works on desktop and mobile
- **Export Function** - Download your chat history as JSON

## Available Models

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| Qwen3 0.6B | 0.6B | Fastest | Good | Quick responses |
| Llama 3.2 1B | 1B | Very Fast | Better | Balanced |
| SmolLM2 1.7B | 1.7B | Fast | Very Good | Code & Math |
| Gemma 2 2B | 2B | Moderate | Very Good | Factual Q&A |
| Llama 3.2 3B | 3B | Moderate | Excellent | Complex tasks |
| Phi-4 Mini | 3.8B | Slower | Excellent | Reasoning |

See [MODELS.md](MODELS.md) for detailed model information.

## Quick Start

### Prerequisites
- Modern browser with WebGPU support (Chrome 113+, Edge 113+, Safari 17.4+)
- Firebase project (for cloud sync)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd llm_in_browser
   ```

2. **Configure Firebase**

   Edit `public/firebase-config.js` and replace the placeholder values with your Firebase project config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "ai-chat-in-your-tab.firebaseapp.com",
     projectId: "ai-chat-in-your-tab",
     storageBucket: "ai-chat-in-your-tab.firebasestorage.app",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

3. **Enable Firebase Services**

   In Firebase Console:
   - Enable **Authentication** > **Anonymous** sign-in
   - Enable **Cloud Firestore**
   - Deploy security rules: `firebase deploy --only firestore:rules`

4. **Local Development**
   ```bash
   # Option 1: Python
   cd public && python -m http.server 8000

   # Option 2: Node.js
   npx serve public

   # Option 3: Firebase Emulator
   firebase emulators:start
   ```

5. **Open in browser** at `http://localhost:8000`

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
firebase deploy
```

## Project Structure

```
llm_in_browser/
├── public/                 # Static files for hosting
│   ├── index.html         # Main HTML
│   ├── app.js             # Main application logic
│   ├── styles.css         # UI styles
│   ├── memory.js          # Context management
│   ├── firebase-config.js # Firebase initialization
│   └── db.js              # Firestore operations
├── firebase.json          # Firebase hosting config
├── firestore.rules        # Security rules
├── .firebaserc            # Project alias
├── MODELS.md              # Model documentation
└── README.md              # This file
```

## How It Works

### AI Inference
1. On first use, the selected model is downloaded and compiled for WebGPU
2. All inference runs in a Web Worker to keep the UI responsive
3. Responses stream token-by-token for real-time feedback
4. Models are cached in IndexedDB for fast subsequent loads

### Context Management
1. Token usage is estimated for each conversation
2. When approaching 70% of the model's context window:
   - Older messages are summarized using the AI
   - Summary is preserved as context
   - Recent messages are kept verbatim
3. This allows unlimited conversation length

### Data Storage
- **Local**: Messages cached in browser during session
- **Cloud**: Synced to Firestore under user's anonymous ID
- **Security**: Firestore rules ensure users only access their own data

## Configuration

### Firebase Project
- Project ID: `ai-chat-in-your-tab`
- Required services: Authentication, Firestore, Hosting

### Security Rules
The included `firestore.rules` ensures:
- Users can only read/write their own data
- All other access is denied
- Rules are enforced server-side

## Browser Requirements

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 113+ |
| Edge | 113+ |
| Safari | 17.4+ (macOS 14.4+) |
| Firefox | 121+ (with flags) |

Check WebGPU support: [webgpureport.org](https://webgpureport.org)

## Troubleshooting

### Model won't load
- Verify WebGPU is supported in your browser
- Check console for detailed error messages
- Ensure enough disk space (~500MB-2GB per model)
- Try a smaller model first

### Slow performance
- Use a smaller model (Qwen3 0.6B recommended for older hardware)
- Close other GPU-intensive applications
- Check GPU temperature for throttling

### Firebase errors
- Verify Firebase config values are correct
- Check that Anonymous Auth is enabled
- Ensure Firestore is created in your project
- Deploy security rules with `firebase deploy --only firestore:rules`

## Development

### Local Testing with Emulators
```bash
firebase emulators:start
```
This runs local Auth and Firestore emulators.

### Adding New Models
1. Check model availability at [MLC-AI Models](https://huggingface.co/mlc-ai)
2. Add model ID to `AVAILABLE_MODELS` in `app.js`
3. Add context limit to `MODEL_CONTEXT_LIMITS` in `memory.js`
4. Update `MODELS.md` documentation

## Credits

Built with:
- [WebLLM](https://github.com/mlc-ai/web-llm) - Browser-based LLM inference
- [Firebase](https://firebase.google.com) - Authentication, database, hosting
- [MLC-AI](https://mlc.ai/) - Machine learning compilation

## License

This project is open source. Model licenses apply from their respective providers (Meta, Google, Microsoft, Alibaba, Hugging Face).
