export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-white/10"
        style={{
          borderTopColor: "var(--site-accent)",
          borderRightColor: "var(--site-accent-2)",
          filter: "drop-shadow(0 0 6px var(--site-accent))",
        }}
      />
    </div>
  );
}
