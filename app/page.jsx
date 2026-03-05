import { useState } from "react";

export default function ModelSearch() {
  const [model, setModel] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  async function search() {
    if (!model.trim()) {
      setError("Please enter a model name.");
      setResults([]);
      return;
    }

    setError("");
    try {
      const res = await fetch(
        `http://101.100.194.245:2008/api.php?model=${encodeURIComponent(model)}`
      );
      const data = await res.json();

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error || "Unknown error");
        setResults([]);
      }
    } catch (e) {
      setError("Fetch failed: " + e.message);
      setResults([]);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20, color: "white", background: "rgba(255 255 255 / 0.05)", borderRadius: 15, backdropFilter: "blur(10px)" }}>
      <h2>📱 Model Search</h2>
      <input
        type="text"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        placeholder="Enter device model"
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", marginBottom: 10, background: "#0f172a", color: "white" }}
      />
      <button
        onClick={search}
        style={{
          width: "100%",
          padding: 14,
          border: "none",
          borderRadius: 10,
          background: "linear-gradient(90deg,#6366f1,#a855f7)",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        🔍 Search Models
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: 20 }}>
        {results.map((r, i) => (
          <div key={i} style={{ padding: "8px 10px", borderBottom: "1px solid #555" }}>
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}
