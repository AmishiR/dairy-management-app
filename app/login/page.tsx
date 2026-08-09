"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setMessage("Logging in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
      return;
    }

    setMessage("✅ Login successful!");

    window.location.href = "/";
  }

  return (
    <main style={{ padding: "40px", maxWidth: "400px", margin: "auto" }}>
      <h1>Dairy Management System</h1>

      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label>Email</label>
          <br />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Password</label>
          <br />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
            }}
          />
        </div>

        <button type="submit">
          Login
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}