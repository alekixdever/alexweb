export default function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        color: "var(--muted)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 16 }}>🗓️</div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--foreground)",
          marginBottom: 8,
        }}
      >
        No Events / イベントなし
      </p>
      <p style={{ fontSize: 13 }}>{message}</p>
    </div>
  );
}
