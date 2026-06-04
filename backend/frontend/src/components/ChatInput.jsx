import { useState } from "react";

export default function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;
    if (isLoading) return;

    const message = input.trim();
    setInput("");
    onSend(message);
  }

  return (
    <div className="chat-input-area">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type your message here..."
        disabled={isLoading}
      />

      <button onClick={handleSend} disabled={isLoading || !input.trim()}>
        {isLoading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}