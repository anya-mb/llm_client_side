/**
 * Main Application Module
 * Chat with LLM
 * Handles UI, LLM inference, and state management
 */

import { CreateMLCEngine } from 'https://esm.run/@mlc-ai/web-llm@0.2.80';
import {
  initializeFirebase,
  signInAnonymousUser,
  onAuthChange,
  getUserId
} from './firebase-config.js';
import {
  createUserProfile,
  createChat,
  getChats,
  getChat,
  updateChat,
  deleteChat,
  addMessage,
  getMessages,
  subscribeToMessages,
  subscribeToChats,
  deleteAllUserData,
  generateChatTitle,
  escapeHtml,
  updateMessageFeedback
} from './db.js';
import {
  createContextManager,
  getContextStatus,
  exportConversation,
  MODEL_CONTEXT_LIMITS
} from './memory.js';

// ============================================================================
// State
// ============================================================================

let engine = null;
let currentModelId = 'Qwen3-0.6B-q4f16_1-MLC';
let currentChatId = null;
let messages = [];
let isGenerating = false;
let contextManager = createContextManager(currentModelId);
let unsubscribeMessages = null;
let unsubscribeChats = null;

// ============================================================================
// DOM Elements
// ============================================================================

const elements = {
  loadingScreen: document.getElementById('loadingScreen'),
  loadingText: document.querySelector('.loading-text'),
  loadingSubtext: document.querySelector('.loading-subtext'),
  chatContainer: document.getElementById('chatContainer'),
  welcomeMessage: document.getElementById('welcomeMessage'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  modelSelect: document.getElementById('modelSelect'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  progressContainer: document.getElementById('progressContainer'),
  progressFill: document.getElementById('progressFill'),
  tokenCount: document.getElementById('tokenCount'),
  contextStatus: document.getElementById('contextStatus'),
  sidebar: document.getElementById('sidebar'),
  chatList: document.getElementById('chatList'),
  settingsPanel: document.getElementById('settingsPanel'),
  overlay: document.getElementById('overlay'),
  menuBtn: document.getElementById('menuBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  newChatBtn: document.getElementById('newChatBtn'),
  themeToggle: document.getElementById('themeToggle'),
  exportBtn: document.getElementById('exportBtn'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  deleteAllBtn: document.getElementById('deleteAllBtn'),
  userIdDisplay: document.getElementById('userIdDisplay'),
  connectionStatus: document.getElementById('connectionStatus')
};

// ============================================================================
// Model Configuration
// ============================================================================

const AVAILABLE_MODELS = [
  { id: 'Qwen3-0.6B-q4f16_1-MLC', name: 'Qwen3 0.6B (Fast)' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B' },
  { id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC', name: 'SmolLM2 1.7B' },
  { id: 'Gemma-2-2b-it-q4f16_1-MLC', name: 'Gemma 2 2B' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B' },
  { id: 'Phi-4-mini-instruct-q4f16_1-MLC', name: 'Phi-4 Mini (Best)' }
];

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  console.log('[App] Initializing...');

  try {
    // Initialize Firebase
    updateLoadingStatus('Connecting to services...');
    await initializeFirebase();

    // Sign in anonymously
    updateLoadingStatus('Setting up your account...');
    await signInAnonymousUser();

    // Create user profile
    await createUserProfile();

    // Display user ID
    elements.userIdDisplay.textContent = getUserId()?.slice(0, 12) + '...';

    // Load existing chats
    updateLoadingStatus('Loading your chats...');
    await loadChats();

    // Subscribe to chat updates
    subscribeToChatsUpdates();

    // Initialize or load chat
    if (!currentChatId) {
      await createNewChat();
    }

    // Initialize LLM engine
    updateLoadingStatus('Loading AI model...');
    await initEngine();

    // Setup event listeners
    setupEventListeners();

    // Hide loading screen
    elements.loadingScreen.classList.add('hidden');

    // Enable input
    elements.messageInput.disabled = false;
    elements.sendBtn.disabled = false;

    console.log('[App] Initialization complete');
  } catch (error) {
    console.error('[App] Initialization error:', error);
    updateLoadingStatus('Error: ' + error.message, true);
  }
}

function updateLoadingStatus(text, isError = false) {
  elements.loadingText.textContent = text;
  if (isError) {
    elements.loadingSubtext.textContent = 'Please refresh the page to try again';
  }
}

// ============================================================================
// LLM Engine
// ============================================================================

async function initEngine() {
  if (engine) {
    console.log('[LLM] Engine already initialized');
    return engine;
  }

  console.log('[LLM] Initializing engine with model:', currentModelId);
  updateStatus('loading', 'Loading model...');
  showProgress(true);

  try {
    engine = await CreateMLCEngine(currentModelId, {
      initProgressCallback(progress) {
        const percent = Math.round(progress.progress * 100);
        updateProgress(percent);
        updateStatus('loading', `Loading: ${percent}% - ${progress.text}`);
        updateLoadingStatus(`Loading model: ${percent}%`);
        elements.loadingSubtext.textContent = progress.text;
      },
      logLevel: 'INFO'
    });

    showProgress(false);
    updateStatus('ready', 'Ready');
    console.log('[LLM] Model loaded successfully');
    return engine;
  } catch (err) {
    console.error('[LLM] Failed to create engine:', err);
    showProgress(false);
    updateStatus('error', 'Model load failed');
    throw err;
  }
}

async function switchModel(newModelId) {
  if (newModelId === currentModelId && engine) {
    return;
  }

  console.log('[LLM] Switching model to:', newModelId);

  // Unload current engine
  if (engine) {
    try {
      await engine.unload();
    } catch (e) {
      console.warn('[LLM] Error unloading engine:', e);
    }
    engine = null;
  }

  currentModelId = newModelId;
  contextManager.setModel(newModelId);

  // Load new model
  await initEngine();

  // Update token display
  updateTokenDisplay();
}

// ============================================================================
// Chat Management
// ============================================================================

async function loadChats() {
  const chats = await getChats();
  renderChatList(chats);

  if (chats.length > 0) {
    // Load most recent chat
    await loadChat(chats[0].id);
  }
}

async function createNewChat() {
  const chatId = await createChat();
  currentChatId = chatId;
  messages = [];

  // Clear context summary
  contextManager.clearSummary();

  // Update UI
  renderMessages();
  elements.welcomeMessage.style.display = 'flex';

  // Subscribe to messages
  subscribeToCurrentChat();

  // Close sidebar on mobile
  closeSidebar();

  return chatId;
}

async function loadChat(chatId) {
  if (chatId === currentChatId) return;

  console.log('[App] Loading chat:', chatId);

  // Unsubscribe from previous chat
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  currentChatId = chatId;

  // Load messages
  messages = await getMessages(chatId);

  // Clear context summary for new chat
  contextManager.clearSummary();

  // Render messages
  renderMessages();

  // Subscribe to updates
  subscribeToCurrentChat();

  // Close sidebar on mobile
  closeSidebar();

  // Update token display
  updateTokenDisplay();
}

function subscribeToCurrentChat() {
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  if (!currentChatId) return;

  unsubscribeMessages = subscribeToMessages(currentChatId, (newMessages) => {
    messages = newMessages;
    renderMessages();
    updateTokenDisplay();
  });
}

function subscribeToChatsUpdates() {
  unsubscribeChats = subscribeToChats((chats) => {
    renderChatList(chats);
  });
}

// ============================================================================
// Message Handling
// ============================================================================

async function sendMessage() {
  const text = elements.messageInput.value.trim();
  if (!text || isGenerating) return;

  // Disable input during generation
  isGenerating = true;
  elements.messageInput.disabled = true;
  elements.sendBtn.disabled = true;
  elements.messageInput.value = '';

  // Hide welcome message
  elements.welcomeMessage.style.display = 'none';

  // Add user message
  const userMessage = { role: 'user', content: text, timestamp: new Date() };
  messages.push(userMessage);
  renderMessages();
  scrollToBottom();

  // Save to Firestore
  await addMessage(currentChatId, 'user', text, currentModelId);

  // Update chat title if first message
  if (messages.length === 1) {
    const title = generateChatTitle(text);
    await updateChat(currentChatId, { title });
  }

  // Show typing indicator
  showTypingIndicator();

  try {
    // Ensure engine is ready
    const llm = await initEngine();
    if (!llm) {
      throw new Error('LLM engine not available');
    }

    // Prepare messages with context management
    const { messages: contextMessages, summarized } = await contextManager.prepare(
      messages,
      async (prompt) => {
        // Use the LLM to generate summary
        const response = await llm.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 200,
          stream: false
        });
        return response.choices[0]?.message?.content || '';
      }
    );

    if (summarized) {
      showSummaryNotice();
    }

    // Generate response
    updateStatus('loading', 'Generating...');

    const stream = await llm.chat.completions.create({
      messages: contextMessages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 512,
      stream: true
    });

    // Remove typing indicator
    hideTypingIndicator();

    // Create assistant message placeholder
    const assistantMessage = { role: 'assistant', content: '', timestamp: new Date() };
    messages.push(assistantMessage);
    renderMessages();

    // Stream response
    let fullResponse = '';
    for await (const chunk of stream) {
      const newText = chunk.choices?.[0]?.delta?.content;
      if (newText) {
        fullResponse += newText;
        assistantMessage.content = fullResponse;
        updateLastMessage(fullResponse);
        scrollToBottom();
      }
    }

    // Save assistant message to Firestore
    const assistantMsgId = await addMessage(currentChatId, 'assistant', fullResponse, currentModelId);
    assistantMessage.id = assistantMsgId;

    updateStatus('ready', 'Ready');
    console.log('[LLM] Generation complete');
  } catch (err) {
    console.error('[LLM] Generation error:', err);
    hideTypingIndicator();
    updateStatus('error', 'Generation failed');

    // Show error message
    const errorMessage = { role: 'assistant', content: 'Sorry, an error occurred. Please try again.', timestamp: new Date() };
    messages.push(errorMessage);
    renderMessages();
  }

  // Re-enable input
  isGenerating = false;
  elements.messageInput.disabled = false;
  elements.sendBtn.disabled = false;
  elements.messageInput.focus();

  // Update token display
  updateTokenDisplay();
}

// ============================================================================
// UI Rendering
// ============================================================================

function renderMessages() {
  // Clear existing messages (except welcome)
  const existingMessages = elements.chatContainer.querySelectorAll('.message, .typing-indicator, .summary-notice');
  existingMessages.forEach(el => el.remove());

  if (messages.length === 0) {
    elements.welcomeMessage.style.display = 'flex';
    return;
  }

  elements.welcomeMessage.style.display = 'none';

  messages.forEach((msg, index) => {
    const messageEl = createMessageElement(msg);
    elements.chatContainer.appendChild(messageEl);
  });

  scrollToBottom();
}

function createMessageElement(message) {
  const div = document.createElement('div');
  div.className = `message ${message.role}`;
  if (message.id) {
    div.dataset.messageId = message.id;
  }

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = message.role === 'user' ? 'U' : 'AI';

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'message-content-wrapper';

  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = formatMessageContent(message.content);

  contentWrapper.appendChild(content);

  // Add feedback buttons for assistant messages
  if (message.role === 'assistant' && message.id) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'message-feedback';

    const thumbsUp = document.createElement('button');
    thumbsUp.className = `feedback-btn ${message.feedback === 'up' ? 'active' : ''}`;
    thumbsUp.dataset.feedback = 'up';
    thumbsUp.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>`;
    thumbsUp.title = 'Good response';
    thumbsUp.onclick = () => handleFeedback(message.id, 'up', thumbsUp, thumbsDown);

    const thumbsDown = document.createElement('button');
    thumbsDown.className = `feedback-btn ${message.feedback === 'down' ? 'active' : ''}`;
    thumbsDown.dataset.feedback = 'down';
    thumbsDown.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>`;
    thumbsDown.title = 'Poor response';
    thumbsDown.onclick = () => handleFeedback(message.id, 'down', thumbsUp, thumbsDown);

    feedbackDiv.appendChild(thumbsUp);
    feedbackDiv.appendChild(thumbsDown);
    contentWrapper.appendChild(feedbackDiv);
  }

  div.appendChild(avatar);
  div.appendChild(contentWrapper);

  return div;
}

/**
 * Handle feedback button click
 */
async function handleFeedback(messageId, feedbackType, upBtn, downBtn) {
  // Toggle feedback - if already selected, clear it
  const currentFeedback = upBtn.classList.contains('active') ? 'up' :
    downBtn.classList.contains('active') ? 'down' : null;

  const newFeedback = currentFeedback === feedbackType ? null : feedbackType;

  // Update UI immediately
  upBtn.classList.toggle('active', newFeedback === 'up');
  downBtn.classList.toggle('active', newFeedback === 'down');

  // Save to Firestore
  try {
    await updateMessageFeedback(currentChatId, messageId, newFeedback);
  } catch (err) {
    console.error('[App] Failed to save feedback:', err);
    // Revert UI on error
    upBtn.classList.toggle('active', currentFeedback === 'up');
    downBtn.classList.toggle('active', currentFeedback === 'down');
  }
}

function formatMessageContent(content) {
  // Escape HTML first
  let formatted = escapeHtml(content);

  // Convert code blocks
  formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Convert inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

function updateLastMessage(content) {
  const lastMessage = elements.chatContainer.querySelector('.message:last-child .message-content');
  if (lastMessage) {
    lastMessage.innerHTML = formatMessageContent(content);
  }
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'message assistant';
  indicator.id = 'typingIndicator';
  indicator.innerHTML = `
    <div class="message-avatar">AI</div>
    <div class="message-content typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;
  elements.chatContainer.appendChild(indicator);
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

function showSummaryNotice() {
  // Remove existing notice
  const existing = elements.chatContainer.querySelector('.summary-notice');
  if (existing) existing.remove();

  const notice = document.createElement('div');
  notice.className = 'summary-notice';
  notice.textContent = 'Earlier conversation has been summarized to fit context window';
  elements.chatContainer.insertBefore(notice, elements.chatContainer.firstChild);
}

function renderChatList(chats) {
  elements.chatList.innerHTML = '';

  chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = `chat-list-item ${chat.id === currentChatId ? 'active' : ''}`;
    item.dataset.chatId = chat.id;

    const time = chat.updatedAt?.toDate?.() || new Date();
    const timeStr = formatTime(time);

    item.innerHTML = `
      <div class="chat-list-item-content">
        <div class="chat-list-item-title">${escapeHtml(chat.title || 'New Chat')}</div>
        <div class="chat-list-item-preview">${chat.messageCount || 0} messages</div>
      </div>
      <span class="chat-list-item-time">${timeStr}</span>
    `;

    item.addEventListener('click', () => loadChat(chat.id));
    elements.chatList.appendChild(item);
  });
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  return date.toLocaleDateString();
}

function scrollToBottom() {
  elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

// ============================================================================
// Status & Progress
// ============================================================================

function updateStatus(state, text) {
  elements.statusDot.className = `status-dot ${state}`;
  elements.statusText.textContent = text;
}

function showProgress(show) {
  elements.progressContainer.style.display = show ? 'block' : 'none';
}

function updateProgress(percent) {
  elements.progressFill.style.width = `${percent}%`;
}

function updateTokenDisplay() {
  const status = getContextStatus(messages, currentModelId);
  elements.tokenCount.textContent = `Tokens: ~${status.current} / ${status.max}`;

  if (status.isNearLimit) {
    elements.tokenCount.classList.add('token-warning');
    elements.contextStatus.textContent = 'Context nearly full';
  } else if (status.needsSummarization) {
    elements.tokenCount.classList.remove('token-warning');
    elements.contextStatus.textContent = 'Will summarize soon';
  } else {
    elements.tokenCount.classList.remove('token-warning');
    elements.contextStatus.textContent = '';
  }
}

// ============================================================================
// Sidebar & Settings
// ============================================================================

function openSidebar() {
  elements.sidebar.classList.add('open');
  elements.overlay.classList.add('visible');
}

function closeSidebar() {
  elements.sidebar.classList.remove('open');
  elements.overlay.classList.remove('visible');
}

function openSettings() {
  elements.settingsPanel.classList.add('open');
  elements.overlay.classList.add('visible');
}

function closeSettings() {
  elements.settingsPanel.classList.remove('open');
  elements.overlay.classList.remove('visible');
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

async function exportChat() {
  const chat = await getChat(currentChatId);
  const exportData = exportConversation(messages, {
    chatTitle: chat?.title,
    model: currentModelId
  });

  const blob = new Blob([exportData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function clearCurrentChat() {
  if (!confirm('Clear all messages in this chat?')) return;

  await deleteChat(currentChatId);
  await createNewChat();
  closeSettings();
}

async function deleteAllData() {
  if (!confirm('Delete ALL your data? This cannot be undone.')) return;
  if (!confirm('Are you sure? All chats will be permanently deleted.')) return;

  await deleteAllUserData();
  await createNewChat();
  closeSettings();
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
  // Send message
  elements.sendBtn.addEventListener('click', sendMessage);

  elements.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  elements.messageInput.addEventListener('input', () => {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 200) + 'px';
  });

  // Model selection
  elements.modelSelect.addEventListener('change', (e) => {
    switchModel(e.target.value);
  });

  // Sidebar
  elements.menuBtn.addEventListener('click', openSidebar);
  elements.newChatBtn.addEventListener('click', createNewChat);

  // Settings
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.closeSettingsBtn.addEventListener('click', closeSettings);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.exportBtn.addEventListener('click', exportChat);
  elements.clearChatBtn.addEventListener('click', clearCurrentChat);
  elements.deleteAllBtn.addEventListener('click', deleteAllData);

  // Overlay
  elements.overlay.addEventListener('click', () => {
    closeSidebar();
    closeSettings();
  });

  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Handle online/offline status
  window.addEventListener('online', () => {
    elements.connectionStatus.innerHTML = '<span class="status-dot ready"></span><span>Synced</span>';
  });

  window.addEventListener('offline', () => {
    elements.connectionStatus.innerHTML = '<span class="status-dot error"></span><span>Offline</span>';
  });
}

// ============================================================================
// Start Application
// ============================================================================

init();
