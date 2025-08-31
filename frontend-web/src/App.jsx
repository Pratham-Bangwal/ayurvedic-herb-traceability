import React, { useState } from "react";
import api from "./api";   // <-- use our axios instance

export default function App() {
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    batchId: "",
    farmerName: "",
    lat: "",
    lng: "",
  });

  async function create(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("batchId", form.batchId);
    formData.append("farmerName", form.farmerName);
    formData.append("lat", form.lat);
    formData.append("lng", form.lng);

    try {
      const res = await api.post("/api/herbs/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("✅ Created: " + res.data.traceUrl);
    } catch (err) {
      setMessage("❌ Error: " + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Manufacturer Dashboard - Demo</h2>
      <form onSubmit={create}>
        <input
          placeholder="Batch ID"
          value={form.batchId}
          onChange={(e) => setForm({ ...form, batchId: e.target.value })}
          required
        />
        <input
          placeholder="Farmer name"
          value={form.farmerName}
          onChange={(e) => setForm({ ...form, farmerName: e.target.value })}
        />
        <input
          placeholder="lat"
          value={form.lat}
          onChange={(e) => setForm({ ...form, lat: e.target.value })}
        />
        <input
          placeholder="lng"
          value={form.lng}
          onChange={(e) => setForm({ ...form, lng: e.target.value })}
        />
        <button type="submit">Create</button>
      </form>
      <div style={{ marginTop: 20 }}>{message}</div>
    </div>
  );
}
