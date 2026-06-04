export default function MessageBubble({ role, content, isLoading }) {
  const isUser = role === "user";

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && <div className="avatar bot-avatar">AI</div>}

      <div className={`message-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
        {isLoading ? (
          <div className="typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          <pre>{content}</pre>
        )}
      </div>

      {isUser && <div className="avatar user-avatar">You</div>}
    </div>
  );
}