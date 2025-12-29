import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm@0.2.80";

const promptInput = document.getElementById("prompt");
const generateBtn = document.getElementById("generateBtn");
const outputDiv = document.getElementById("output");

let engine = null;

// Initialize engine with logs
async function initEngine() {
  if (engine) {
    console.log("[LLM] Engine already initialized");
    return engine;
  }

  console.log("[LLM] Initializing engine...");

  try {
    // Model string from WebLLM model list
    const modelId = "Qwen3-0.6B-q4f16_1-MLC";// "Llama-3.2-3B-Instruct-q4f16_1-MLC"; //"Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

    console.log(`[LLM] Creating MLCEngine for model: ${modelId}`);

    engine = await CreateMLCEngine(modelId, {
      initProgressCallback(progress) {
        // progress = { text: string, progress: number }
        console.log(`[LLM] Download/compile progress: ${Math.round(progress.progress * 100)}% – ${progress.text}`);
      },
      logLevel: "INFO"
    });

    console.log("[LLM] Model loaded and engine ready!");
  } catch (err) {
    console.error("[LLM] Failed to create engine:", err);
    alert("Failed to load model — see console logs");
    engine = null;
  }

  return engine;
}

async function generateStory() {
  const text = promptInput.value.trim();
  if (!text) {
    alert("Please write a prompt!");
    return;
  }

  outputDiv.textContent = "";
  console.log("[LLM] Starting generation...");

  const llm = await initEngine();
  if (!llm) return;

  try {
    const stream = await llm.chat.completions.create({
      messages: [{ role: "user", content: text }],
      temperature: 0.7,
      max_tokens: 512,
      stream: true
    });

    console.log("[LLM] Streaming response tokens...");
    for await (const chunk of stream) {
      const newText = chunk.choices?.[0]?.delta?.content;
      if (newText) {
        outputDiv.textContent += newText;
        outputDiv.scrollTop = outputDiv.scrollHeight;
      }
    }
    console.log("[LLM] Generation finished.");
  } catch (err) {
    console.error("[LLM] Streaming error:", err);
    outputDiv.textContent += "\n\n⚠️ Streaming error — see console";
  }
}

generateBtn.addEventListener("click", generateStory);
