import * as webllm from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/dist/web-llm.js";

// DOM refs
const promptBox = document.getElementById("prompt");
const generateBtn = document.getElementById("generateBtn");
const outputBox = document.getElementById("output");

// Lazy load engine
let llmEngine = null;

async function initLLM() {
  if (llmEngine) return llmEngine;

  // This points at Qwen2.5-0.5B-Instruct MLC model hosted on HF
  const modelId = "HF://mlc-ai/Qwen2.5-0.5B-Instruct-q0f32-MLC";

  llmEngine = await webllm.createLLM({
    model: modelId,
    backend: "webgpu", // Use WebGPU for performance (fallback to wasm if needed)
    quantization: "q0f32", // small quantized weights
  });

  return llmEngine;
}

// Streaming handler
async function generateStory() {
  const rawPrompt = promptBox.value.trim();
  if (!rawPrompt) return alert("Please enter a prompt!");

  outputBox.textContent = ""; // clear old output

  const engine = await initLLM();

  // Kick off streaming
  for await (const chunk of engine.stream({
      model: engine.model,
      input: rawPrompt,
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.9
  })) {
    outputBox.textContent += chunk; // append chunk as it arrives
    outputBox.scrollTop = outputBox.scrollHeight;
  }
}

generateBtn.addEventListener("click", generateStory);
