const sessions = new Map();

export function getMessages(sessionId) {
  return sessions.get(sessionId) || [];
}

export function addMessage(sessionId, role, content) {
  const messages = getMessages(sessionId);

  messages.push({
    role,
    content,
  });

  // Last 20 messages only, taake context heavy na ho
  sessions.set(sessionId, messages.slice(-20));
}