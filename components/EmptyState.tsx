export default function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        minHeight: 240,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--bg-glass)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        🗓️
      </div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--fg-secondary)",
          marginBottom: 8,
        }}
      >
        No Events / イベントなし
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--fg-muted)",
          maxWidth: 280,
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
    </div>
  );
}
