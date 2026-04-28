"use client";

import { useEffect, useState } from "react";

export default function TestDB() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    const checkDB = async () => {
      try {
        const res = await fetch("/api/test-db");
        const data = await res.json();

        if (res.ok) {
          setStatus("✅ Database Connected Successfully");
        } else {
          setStatus("❌ Failed: " + data.error);
        }
      } catch (err) {
        setStatus("❌ Error: " + err.message);
      }
    };

    checkDB();
  }, []);

  return (
    <div style={{ padding: "20px", fontSize: "18px" }}>
      <h1>Database Connection Test</h1>
      <p>{status}</p>
    </div>
  );
}