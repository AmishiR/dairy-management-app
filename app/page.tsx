"use client";

import { useEffect, useState } from "react";
import { createClient } from "./lib/supabase/client";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function testSupabase() {
      const supabase = createClient();

      // Check logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      // Try reading products
      const { data, error } = await supabase
        .from("products")
        .select("*");

      if (error) {
        setError(error.message);
        return;
      }

      setProducts(data || []);
    }

    testSupabase();
  }, []);

  return (
    <main style={{ padding: "40px" }}>
      <h1>Dairy Management System</h1>

      <h2>Authentication Test</h2>

      {user ? (
        <>
          <p>✅ Logged in</p>
          <p>User ID: {user.id}</p>
          <p>Email: {user.email}</p>
        </>
      ) : (
        <p>❌ NOT logged in</p>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h2>Products</h2>

      {error && (
        <p style={{ color: "red" }}>
          ❌ Error: {error}
        </p>
      )}

      {products.length === 0 && !error && (
        <p>⚠️ No products found.</p>
      )}

      {products.map((product) => (
        <div key={product.product_id}>
          <strong>{product.product_name}</strong>
          {" — "}
          {product.product_code}
        </div>
      ))}
    </main>
  );
}