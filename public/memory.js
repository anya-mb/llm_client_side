/**
 * Memory Management Module
 * Handles context window management and conversation summarization
 */

// Conditional logging
const DEBUG = false;
function log(...args) {
  if (DEBUG) console.log(...args);
}

// Model context limits (conservative estimates for 4-bit quantized models)
export const MODEL_CONTEXT_LIMITS = {
  'Qwen3-0.6B-q4f16_1-MLC': 4096,
  'Llama-3.2-1B-Instruct-q4f16_1-MLC': 8192,
  'SmolLM2-1.7B-Instruct-q4f16_1-MLC': 4096,
  'gemma-2-2b-it-q4f16_1-MLC': 4096,
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': 8192,
  'Phi-3.5-mini-instruct-q4f16_1-MLC': 8192
};

// Summarization threshold (70% of context)
const SUMMARIZE_THRESHOLD = 0.7;

// Minimum messages to keep verbatim
const MIN_RECENT_MESSAGES = 6;

/**
 * Estimate token count for a string
 * Uses approximation: ~4 characters per token for English
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  if (!text) return 0;
  // More accurate estimation considering whitespace and punctuation
  return Math.ceil(text.length / 3.5);
}

/**
 * Estimate total tokens for message array
 * @param {Array} messages - Array of message objects
 * @returns {number} Total estimated tokens
 */
export function estimateMessagesTokens(messages) {
  return messages.reduce((total, msg) => {
    // Account for role overhead (~4 tokens per message for formatting)
    return total + estimateTokens(msg.content) + 4;
  }, 0);
}

/**
 * Check if context needs summarization
 * @param {Array} messages - Current messages
 * @param {string} modelId - Current model ID
 * @returns {boolean} Whether summarization is needed
 */
export function needsSummarization(messages, modelId) {
  const maxTokens = MODEL_CONTEXT_LIMITS[modelId] || 4096;
  const currentTokens = estimateMessagesTokens(messages);
  return currentTokens > maxTokens * SUMMARIZE_THRESHOLD;
}

/**
 * Get context status for UI display
 * @param {Array} messages - Current messages
 * @param {string} modelId - Current model ID
 * @returns {Object} Status info with tokens, max, and percentage
 */
export function getContextStatus(messages, modelId) {
  const maxTokens = MODEL_CONTEXT_LIMITS[modelId] || 4096;
  const currentTokens = estimateMessagesTokens(messages);
  const percentage = Math.round((currentTokens / maxTokens) * 100);

  return {
    current: currentTokens,
    max: maxTokens,
    percentage,
    needsSummarization: percentage > SUMMARIZE_THRESHOLD * 100,
    isNearLimit: percentage > 90
  };
}

/**
 * Create summarization prompt
 * @param {Array} messages - Messages to summarize
 * @returns {string} Prompt for summarization
 */
function createSummarizationPrompt(messages) {
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  return `Summarize this conversation concisely, preserving:
- Key facts and information shared
- User preferences mentioned
- Important context needed for future responses
- Any decisions or conclusions reached

Keep the summary under 200 words.

Conversation:
${conversationText}

Summary:`;
}

/**
 * Prepare messages for API call with context management
 * Implements rolling summarization when approaching context limit
 * @param {Array} messages - Full message history
 * @param {string} modelId - Current model ID
 * @param {Function} summarizeFunc - Async function to call LLM for summarization
 * @returns {Promise<Object>} { messages: processed messages, summarized: boolean }
 */
export async function prepareMessagesForContext(messages, modelId, summarizeFunc) {
  const maxTokens = MODEL_CONTEXT_LIMITS[modelId] || 4096;
  const targetTokens = Math.floor(maxTokens * SUMMARIZE_THRESHOLD);

  // If within limits, return as-is
  if (estimateMessagesTokens(messages) <= targetTokens) {
    return { messages, summarized: false, summaryContext: null };
  }

  // Need to summarize
  log('[Memory] Context limit approaching, initiating summarization...');

  // Keep the most recent messages verbatim
  const recentMessages = messages.slice(-MIN_RECENT_MESSAGES);
  const olderMessages = messages.slice(0, -MIN_RECENT_MESSAGES);

  if (olderMessages.length === 0) {
    // Not enough messages to summarize, just return recent
    return { messages: recentMessages, summarized: false, summaryContext: null };
  }

  // Generate summary of older messages
  const summaryPrompt = createSummarizationPrompt(olderMessages);

  let summary;
  try {
    summary = await summarizeFunc(summaryPrompt);
  } catch (err) {
    console.error('[Memory] Summarization failed:', err);
    // Fallback: just truncate older messages
    return { messages: recentMessages, summarized: false, summaryContext: null };
  }

  // Create system message with context summary
  const summaryContext = `Previous conversation summary: ${summary}`;

  // Build new message array with summary context
  const processedMessages = [
    { role: 'system', content: summaryContext },
    ...recentMessages
  ];

  log('[Memory] Summarization complete. Reduced from', messages.length, 'to', processedMessages.length, 'messages');

  return {
    messages: processedMessages,
    summarized: true,
    summaryContext
  };
}

/**
 * Simple fallback summarization without LLM
 * Used when model is not available
 * @param {Array} messages - Messages to summarize
 * @returns {string} Simple summary
 */
export function simpleSummarize(messages) {
  const topics = [];
  const keyPhrases = [];

  messages.forEach(msg => {
    if (msg.role === 'user') {
      // Extract potential topics from user messages
      const words = msg.content.split(/\s+/).filter(w => w.length > 5);
      keyPhrases.push(...words.slice(0, 3));
    }
  });

  // Get unique key phrases
  const uniquePhrases = [...new Set(keyPhrases)].slice(0, 10);

  return `The conversation covered topics including: ${uniquePhrases.join(', ')}. ` +
    `${messages.length} messages were exchanged between user and assistant.`;
}

/**
 * Export conversation to JSON
 * @param {Array} messages - Messages to export
 * @param {Object} metadata - Additional metadata
 * @returns {string} JSON string
 */
export function exportConversation(messages, metadata = {}) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    ...metadata,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || null
    }))
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Create a context window manager instance
 * @param {string} modelId - Initial model ID
 * @returns {Object} Manager with methods
 */
export function createContextManager(modelId) {
  let currentModelId = modelId;
  let conversationSummary = null;

  return {
    setModel(newModelId) {
      currentModelId = newModelId;
    },

    getMaxTokens() {
      return MODEL_CONTEXT_LIMITS[currentModelId] || 4096;
    },

    getStatus(messages) {
      return getContextStatus(messages, currentModelId);
    },

    needsSummarization(messages) {
      return needsSummarization(messages, currentModelId);
    },

    async prepare(messages, summarizeFunc) {
      const result = await prepareMessagesForContext(messages, currentModelId, summarizeFunc);
      if (result.summaryContext) {
        conversationSummary = result.summaryContext;
      }
      return result;
    },

    getSummary() {
      return conversationSummary;
    },

    clearSummary() {
      conversationSummary = null;
    }
  };
}
