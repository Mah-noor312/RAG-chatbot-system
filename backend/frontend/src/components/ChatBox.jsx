import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api/chatApi";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

export default function ChatBox() {
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I am your AI assistant. How can I help you today?",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(userMessage) {
    if (isSendingRef.current) return;
    if (!userMessage.trim()) return;

    isSendingRef.current = true;
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "" },
    ]);

    try {
      await sendChatMessage({
        sessionId,
        message: userMessage,
        onChunk: (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + chunk,
            };

            return updated;
          });
        },
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
          ...updated[lastIndex],
          content:
            "Sorry, I could not generate a response. Please try again.",
        };

        return updated;
      });
    } finally {
      isSendingRef.current = false;
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    setSessionId(`session-${Date.now()}`);

    setMessages([
      {
        role: "assistant",
        content: "New chat started. What would you like to ask?",
      },
    ]);
  }

  return (
    <div className="page">
      <div className="chat-wrapper">
        <div className="chat-header">
          <div>
            <h2>AI Chatbot</h2>
            <p>Ask anything. Get instant answers.</p>
          </div>

          <button className="new-chat-btn" onClick={handleNewChat}>
            New Chat
          </button>
        </div>

        <div className="messages-area">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              role={msg.role}
              content={msg.content}
              isLoading={
                isLoading &&
                index === messages.length - 1 &&
                msg.role === "assistant" &&
                msg.content === ""
              }
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}