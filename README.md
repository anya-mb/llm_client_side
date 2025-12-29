# Client-Side Story Generator

A fully client-side AI story generator that runs entirely in your browser using WebLLM. No server, no API keys, no data leaves your machine.

## Features

### Core Capabilities
- **100% Client-Side Execution** - Powered by WebLLM and WebGPU, runs completely in your browser
- **Privacy-First** - All processing happens locally; your prompts never leave your device
- **Real-Time Streaming** - Watch stories generate token-by-token as the AI creates them
- **No API Keys Required** - No external services, no costs, no rate limits
- **Offline Capable** - Once the model is downloaded, works without internet connection

### Technical Highlights
- **Qwen3-0.6B Model** - Efficient quantized model optimized for browser inference
- **Progress Tracking** - Visual feedback during model download and compilation
- **Optimized Performance** - Uses WebGPU acceleration for fast inference
- **Simple Interface** - Clean, minimal UI focused on the generation experience

## How It Works

1. **Model Loading**: On first use, the Qwen3-0.6B model (quantized to 4-bit) is downloaded and compiled for WebGPU
2. **Browser Inference**: Uses MLC-AI's WebLLM engine to run the LLM directly in your browser
3. **Streaming Output**: Responses stream token-by-token using the OpenAI-compatible API
4. **Persistent Cache**: Model stays cached in browser storage for instant future use

## Usage

### Quick Start

1. **Clone or download** this repository
2. **Serve the files** using any local server:
   ```bash
   # Option 1: Python
   python -m http.server 8000

   # Option 2: Node.js
   npx serve

   # Option 3: VS Code Live Server extension
   ```
3. **Open in browser** at `http://localhost:8000`
4. **Wait for model download** (first time only - ~300-500MB)
5. **Enter a prompt** and click "Generate Story"

### Example Prompts
- "Write a short story about a robot learning to paint"
- "Create a mystery involving a missing book in a library"
- "Tell me a tale about a chef who discovers magic ingredients"

## Technical Details

### Model Configuration
- **Model**: Qwen3-0.6B-q4f16_1-MLC
- **Quantization**: 4-bit weights, 16-bit activations
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 512 per generation
- **Streaming**: Enabled for real-time output

### Code Structure
```
├── index.html    # UI interface
├── app.js        # WebLLM integration and generation logic
└── README.md     # Documentation
```

### Key Functions
- `initEngine()` - Initializes MLC engine with progress callbacks (app.js:10)
- `generateStory()` - Handles prompt submission and streaming (app.js:42)
- Progress tracking via `initProgressCallback` (app.js:25-28)

## Requirements

### Browser Support
Requires a modern browser with **WebGPU support**:
- Chrome/Edge 113+
- Firefox 117+ (with flags enabled)
- Safari 17.4+ (macOS 14.4+)

### Hardware
- **GPU**: Discrete GPU recommended for best performance
- **RAM**: At least 4GB available
- **Storage**: ~500MB for model cache

### Check WebGPU Support
Visit [webgpureport.org](https://webgpureport.org/) to verify your browser supports WebGPU.

## Model Options

The code includes commented alternatives (app.js:20):
```javascript
// Current: Qwen3-0.6B-q4f16_1-MLC (fastest, good quality)
// Alternative: Llama-3.2-3B-Instruct-q4f16_1-MLC (larger, better quality)
// Alternative: Qwen2.5-1.5B-Instruct-q4f16_1-MLC (balanced)
```

To switch models, uncomment the desired model ID in app.js:20.

## Performance

- **First Load**: 30-120 seconds (model download + compilation)
- **Subsequent Loads**: 5-10 seconds (cached model)
- **Generation Speed**: ~10-30 tokens/second (depends on GPU)

## Troubleshooting

### Model fails to load
- Check browser console for detailed error messages
- Verify WebGPU support in your browser
- Ensure sufficient disk space for model cache
- Try clearing browser cache and reloading

### Slow generation
- Close other GPU-intensive applications
- Try a smaller model variant
- Check GPU isn't thermal throttling

### Out of memory errors
- Use a smaller model (Qwen3-0.6B recommended for most systems)
- Close other browser tabs
- Increase browser memory limits if possible

## Credits

Built with:
- [WebLLM](https://github.com/mlc-ai/web-llm) - Browser-based LLM inference
- [MLC-AI](https://mlc.ai/) - Machine Learning Compilation framework
- [Qwen Models](https://github.com/QwenLM/Qwen) - Alibaba's Qwen language models

## License

This project is open source. Model licenses apply from their respective providers.
