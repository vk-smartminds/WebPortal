"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { BASE_API_URL } from "./apiurl";

export default function Home() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: "#f9f9f9",
      backgroundImage: `
        linear-gradient(135deg, rgba(0,0,0,0.03) 25%, transparent 25%),
        linear-gradient(225deg, rgba(0,0,0,0.03) 25%, transparent 25%),
        linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%),
        linear-gradient(315deg, rgba(0,0,0,0.03) 25%, transparent 25%)
      `,
      backgroundSize: "40px 40px",
      backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontFamily: "Segoe UI, Arial, sans-serif"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.96)",
        borderRadius: 20,
        padding: "40px 32px",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        textAlign: "center",
        maxWidth: 400,
        width: "95%"
      }}>
        <img
          src="https://img.icons8.com/color/96/000000/open-book--v2.png"
          alt="VK Publications"
          style={{ marginBottom: 24 }}
        />
        <h1 style={{
          fontWeight: 700,
          fontSize: "2.5rem",
          marginBottom: 16,
          letterSpacing: 1,
          color: "#1e3c72"
        }}>
          VK Publications
        </h1>
        <p style={{
          fontSize: "1.1rem",
          marginBottom: 32,
          color: "#444"
        }}>
          Welcome to the future of learning. Explore, connect, and grow with our platform.
        </p>
        <button
          onClick={() => router.push("/login")}
          style={{
            background: "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 32px",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "transform 0.1s"
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          Login
        </button>
      </div>
      <div style={{
        marginTop: 40,
        fontSize: "0.95rem",
        color: "#1e3c72",
        letterSpacing: 0.5
      }}>
        © {new Date().getFullYear()} VK Publications. All rights reserved.
      </div>
    </div>
  );
}
