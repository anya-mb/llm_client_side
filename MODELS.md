# Available Browser LLM Models

This document provides an overview of all language models available for in-browser inference in this chat application. All models run 100% client-side using WebLLM and WebGPU.

## Model Comparison Table

| Model | Parameters | VRAM Required | Speed | Quality | Best For |
|-------|------------|---------------|-------|---------|----------|
| Qwen3-0.6B | 0.6B | ~400MB | Fastest | Good | Quick responses, low-end devices |
| Llama-3.2-1B | 1B | ~600MB | Very Fast | Better | Balanced performance |
| SmolLM2-1.7B | 1.7B | ~1GB | Fast | Very Good | Best small model quality |
| Gemma-2-2B | 2B | ~1.2GB | Moderate | Very Good | Google's efficient model |
| Llama-3.2-3B | 3B | ~2GB | Moderate | Excellent | Higher quality responses |
| Phi-4-mini | 3.8B | ~2.5GB | Slower | Excellent | Complex reasoning tasks |

## Detailed Model Information

### Qwen3-0.6B-q4f16_1-MLC
**Developer:** Alibaba (Qwen Team)
**Parameters:** 0.6 Billion
**Quantization:** 4-bit weights, 16-bit activations
**Context Window:** 32K tokens

**Strengths:**
- Extremely fast inference
- Low memory footprint
- Works on most devices with WebGPU support
- Good multilingual support (English, Chinese)

**Best Use Cases:**
- Quick Q&A
- Simple conversations
- Devices with limited GPU memory

---

### Llama-3.2-1B-Instruct-q4f16_1-MLC
**Developer:** Meta
**Parameters:** 1 Billion
**Quantization:** 4-bit weights, 16-bit activations
**Context Window:** 128K tokens

**Strengths:**
- Optimized for edge devices
- Large context window
- Strong instruction following
- Good reasoning for its size

**Best Use Cases:**
- General chat
- Long conversations
- Mobile-first applications

---

### SmolLM2-1.7B-Instruct-q4f16_1-MLC
**Developer:** Hugging Face
**Parameters:** 1.7 Billion
**Quantization:** 4-bit weights, 16-bit activations
**Context Window:** 8K tokens

**Strengths:**
- State-of-the-art for small models
- Trained on 11 trillion tokens
- Excellent code understanding
- Strong math capabilities

**Best Use Cases:**
- Code assistance
- Math problems
- High-quality responses on limited hardware

---

### Gemma-2-2b-it-q4f16_1-MLC
**Developer:** Google DeepMind
**Parameters:** 2 Billion
**Quantization:** 4-bit weights, 16-bit activations
**Context Window:** 8K tokens

**Strengths:**
- Google's latest efficient architecture
- Strong safety training
- Good factual accuracy
- Efficient inference

**Best Use Cases:**
- Factual Q&A
- Safe, family-friendly conversations
- Educational applications

---

### Llama-3.2-3B-Instruct-q4f16_1-MLC
**Developer:** Meta
**Parameters:** 3 Billion
**Quantization:** 4-bit weights, 16-bit activations
**Context Window:** 128K tokens

**Strengths:**
- Significantly better quality than 1B version
- Massive context window
- Strong reasoning and creativity
- Good code generation

**Best Use Cases:**
- Complex conversations
- Creative writing
- Code generation
- Analysis tasks

---

### Phi-4-mini-instruct-q4f16_1-MLC
**Developer:** Microsoft
**Parameters:** 3.8 Billion
**Quantization:** 4-bit weights, 16-bit activations
**Context Window:** 16K tokens

**Strengths:**
- Excellent reasoning capabilities
- Strong math and logic
- High-quality code generation
- Best overall quality in this lineup

**Best Use Cases:**
- Complex reasoning
- Mathematics
- Code development
- Technical discussions

---

## Quantization Explained

All models use **q4f16_1** quantization:
- **q4**: Weights quantized to 4-bit integers
- **f16**: Activations use 16-bit floating point
- **_1**: Version 1 of the quantization scheme

This reduces model size by ~4x compared to full precision while maintaining most of the quality.

## Hardware Requirements

### Minimum Requirements
- **Browser:** Chrome 113+, Edge 113+, or Safari 17.4+
- **GPU:** Any GPU with WebGPU support
- **RAM:** 4GB system RAM
- **VRAM:** Varies by model (see table above)

### Recommended for Best Experience
- **GPU:** Discrete GPU (NVIDIA, AMD, or Apple Silicon)
- **VRAM:** 4GB+ dedicated
- **Connection:** Fast internet for initial model download

## First Load Times

| Model | Download Size | First Load | Subsequent Loads |
|-------|--------------|------------|------------------|
| Qwen3-0.6B | ~350MB | 30-60s | 3-5s |
| Llama-3.2-1B | ~500MB | 45-90s | 5-8s |
| SmolLM2-1.7B | ~900MB | 60-120s | 8-12s |
| Gemma-2-2B | ~1.1GB | 90-150s | 10-15s |
| Llama-3.2-3B | ~1.8GB | 120-180s | 15-20s |
| Phi-4-mini | ~2.2GB | 150-240s | 20-30s |

*Times vary based on internet speed and GPU performance.*

## Switching Models

You can switch models at any time using the dropdown in the header. Note:
1. Switching models requires downloading and compiling the new model
2. Your chat history is preserved
3. The conversation context is maintained

## Troubleshooting

### "WebGPU not supported"
- Use Chrome, Edge, or Safari (latest versions)
- Check [webgpureport.org](https://webgpureport.org) for compatibility

### "Out of memory"
- Try a smaller model (Qwen3-0.6B or Llama-3.2-1B)
- Close other browser tabs
- Restart your browser

### Slow generation
- Use a smaller model
- Close GPU-intensive applications
- Check if your GPU is thermal throttling

---

## Sources

- [WebLLM GitHub](https://github.com/mlc-ai/web-llm)
- [MLC-AI Models](https://huggingface.co/mlc-ai)
- [Qwen Models](https://github.com/QwenLM/Qwen)
- [Meta Llama](https://llama.meta.com/)
- [Google Gemma](https://ai.google.dev/gemma)
- [Microsoft Phi](https://azure.microsoft.com/en-us/products/phi-3)
- [Hugging Face SmolLM](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct)
