/**
 * Database Operations Module
 * Handles all Firestore CRUD operations for chat data
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import { getDb, getUserId } from './firebase-config.js';

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate a custom message ID in format: YYYYMMDDHHMMSS-XX
 * Model name is stored inside the message document as `modelId` field
 * @returns {string} Custom message ID
 */
export function generateMessageId() {
  const now = new Date();

  // Format: YYYYMMDDHHMMSS
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  // Generate 2 random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = letters.charAt(Math.floor(Math.random() * 26)) +
    letters.charAt(Math.floor(Math.random() * 26));

  return `${timestamp}-${randomLetters}`;
}

/**
 * Create or update user profile
 * @returns {Promise<void>}
 */
export async function createUserProfile() {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();
  const profileRef = doc(db, 'users', userId, 'profile', 'info');

  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    // Create new profile
    await setDoc(profileRef, {
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });
    console.log('[DB] Created new user profile');
  } else {
    // Update last active
    await updateDoc(profileRef, {
      lastActive: serverTimestamp()
    });
  }
}

/**
 * Create a new chat
 * @param {string} title - Chat title (optional, will be generated)
 * @returns {Promise<string>} Chat ID
 */
export async function createChat(title = 'New Chat') {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();
  const chatsRef = collection(db, 'users', userId, 'chats');

  const chatDoc = await addDoc(chatsRef, {
    title: title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messageCount: 0
  });

  console.log('[DB] Created chat:', chatDoc.id);
  return chatDoc.id;
}

/**
 * Get all chats for current user
 * @param {number} maxChats - Maximum number of chats to retrieve
 * @returns {Promise<Array>} Array of chat objects
 */
export async function getChats(maxChats = 50) {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();
  const chatsRef = collection(db, 'users', userId, 'chats');
  const q = query(chatsRef, orderBy('updatedAt', 'desc'), limit(maxChats));

  const snapshot = await getDocs(q);
  const chats = [];

  snapshot.forEach((doc) => {
    chats.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return chats;
}

/**
 * Get a single chat by ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object|null>} Chat object or null
 */
export async function getChat(chatId) {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();
  const chatRef = doc(db, 'users', userId, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    return { id: chatSnap.id, ...chatSnap.data() };
  }
  return null;
}

/**
 * Update chat metadata
 * @param {string} chatId - Chat ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export async function updateChat(chatId, data) {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();
  const chatRef = doc(db, 'users', userId, 'chats', chatId);

  await updateDoc(chatRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a chat and all its messages
 * @param {string} chatId - Chat ID
 * @returns {Promise<void>}
 */
export async function deleteChat(chatId) {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();

  // First delete all messages in the chat
  const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const messagesSnap = await getDocs(messagesRef);

  const batch = writeBatch(db);
  messagesSnap.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete the chat document
  const chatRef = doc(db, 'users', userId, 'chats', chatId);
  batch.delete(chatRef);

  await batch.commit();
  console.log('[DB] Deleted chat:', chatId);
}

/**
 * Add a message to a chat
 * @param {string} chatId - Chat ID
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 * @param {string} modelId - The LLM model ID used
 * @returns {Promise<string>} Message ID
 */
export async function addMessage(chatId, role, content, modelId = 'unknown') {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();

  // Generate custom message ID (format: YYYYMMDDHHMMSS-XX)
  const messageId = generateMessageId();
  const messageRef = doc(db, 'users', userId, 'chats', chatId, 'messages', messageId);

  await setDoc(messageRef, {
    role,
    content,
    modelId,
    timestamp: serverTimestamp(),
    feedback: null // null = no feedback, 'up' = thumbs up, 'down' = thumbs down
  });

  // Update chat's updatedAt and message count
  const chatRef = doc(db, 'users', userId, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  const currentCount = chatSnap.data()?.messageCount || 0;

  await updateDoc(chatRef, {
    updatedAt: serverTimestamp(),
    messageCount: currentCount + 1
  });

  return messageId;
}

/**
 * Update message feedback (thumbs up/down)
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 * @param {string|null} feedback - 'up', 'down', or null to clear
 * @returns {Promise<void>}
 */
export async function updateMessageFeedback(chatId, messageId, feedback) {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();
  const messageRef = doc(db, 'users', userId, 'chats', chatId, 'messages', messageId);

  await updateDoc(messageRef, {
    feedback: feedback
  });

  console.log('[DB] Updated feedback for message:', messageId, feedback);
}

/**
 * Get messages for a chat
 * @param {string} chatId - Chat ID
 * @param {number} maxMessages - Maximum messages to retrieve
 * @returns {Promise<Array>} Array of message objects
 */
export async function getMessages(chatId, maxMessages = 100) {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();
  const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(maxMessages));

  const snapshot = await getDocs(q);
  const messages = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    messages.push({
      id: docSnap.id,
      role: data.role,
      content: data.content,
      modelId: data.modelId || null,
      feedback: data.feedback || null,
      timestamp: data.timestamp?.toDate?.() || new Date()
    });
  });

  return messages;
}

/**
 * Subscribe to messages in real-time
 * @param {string} chatId - Chat ID
 * @param {Function} callback - Called with messages array on changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToMessages(chatId, callback) {
  const userId = getUserId();
  if (!userId) {
    console.warn('[DB] Cannot subscribe: User not authenticated');
    return () => {};
  }

  const db = getDb();
  const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        role: data.role,
        content: data.content,
        modelId: data.modelId || null,
        feedback: data.feedback || null,
        timestamp: data.timestamp?.toDate?.() || new Date()
      });
    });
    callback(messages);
  }, (error) => {
    console.error('[DB] Subscription error:', error);
  });
}

/**
 * Subscribe to chats list in real-time
 * @param {Function} callback - Called with chats array on changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToChats(callback) {
  const userId = getUserId();
  if (!userId) {
    console.warn('[DB] Cannot subscribe: User not authenticated');
    return () => {};
  }

  const db = getDb();
  const chatsRef = collection(db, 'users', userId, 'chats');
  const q = query(chatsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const chats = [];
    snapshot.forEach((doc) => {
      chats.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(chats);
  }, (error) => {
    console.error('[DB] Chats subscription error:', error);
  });
}

/**
 * Delete all user data
 * @returns {Promise<void>}
 */
export async function deleteAllUserData() {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');

  const db = getDb();

  // Get all chats
  const chats = await getChats(1000);

  // Delete each chat (which also deletes messages)
  for (const chat of chats) {
    await deleteChat(chat.id);
  }

  // Delete profile
  const profileRef = doc(db, 'users', userId, 'profile', 'info');
  await deleteDoc(profileRef);

  console.log('[DB] Deleted all user data');
}

/**
 * Generate a chat title from first message
 * @param {string} content - First message content
 * @returns {string} Generated title
 */
export function generateChatTitle(content) {
  // Take first 50 chars, cut at last word boundary
  let title = content.slice(0, 50);
  if (content.length > 50) {
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 20) {
      title = title.slice(0, lastSpace);
    }
    title += '...';
  }
  return title;
}
