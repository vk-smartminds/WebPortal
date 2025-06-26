"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BASE_API_URL } from "./apiurl";

const btnStyle = {
  background: "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)",
  color: "#fff", border: "none", borderRadius: 8, padding: "12px 0",
  fontSize: "1.1rem", fontWeight: 600, cursor: "pointer"
};
const inputStyle = {
  width: "100%", padding: 8, margin: "8px 0", borderRadius: 6, border: "1px solid #ccc"
};

export default function RegisterTeacher() {
  const [form, setForm] = useState({ name: '', email: '', otp: '', password: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [msg, setMsg] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [otpBlocks, setOtpBlocks] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [otpTimer, setOtpTimer] = useState(0);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSendOtp = async e => {
    e.preventDefault();
    setMsg(""); setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE_API_URL}/teacher/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() })
      });
      if (res.ok) {
        setOtpSent(true); setMsg("OTP sent to your email.");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Failed to send OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleOtpBlockChange = (idx, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newBlocks = [...otpBlocks];
    newBlocks[idx] = val;
    setOtpBlocks(newBlocks);
    if (val && idx < 5) otpRefs[idx + 1].current.focus();
  };

  const handleOtpBlockKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpBlocks[idx] && idx > 0) {
      otpRefs[idx - 1].current.focus();
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(""); setError(""); setLoading(true);
    try {
      if (getPasswordSuggestions(form.password).length > 0) {
        setError('Password is not strong enough.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${BASE_API_URL}/teacher/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: form.email.trim().toLowerCase(), otp: otpBlocks.join("") })
      });
      if (res.ok) {
        setMsg("Registration successful! Redirecting...");
        localStorage.setItem("userEmail", form.email.trim().toLowerCase());
        setTimeout(() => { 
          router.replace("/teacher/dashboard"); 
        }, 1200);
      } else {
        const data = await res.json(); setError(data.message || "Registration failed.");
      }
    } catch {
      setError("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  function getPasswordRequirements(password) {
    return {
      length: password.length >= 8 && password.length <= 30,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    };
  }
  function getPasswordSuggestions(password) {
    const req = getPasswordRequirements(password);
    const suggestions = [];
    if (!req.length) suggestions.push('8-30 characters');
    if (!req.uppercase) suggestions.push('an uppercase letter');
    if (!req.lowercase) suggestions.push('a lowercase letter');
    if (!req.number) suggestions.push('a number');
    return suggestions;
  }

  useEffect(() => {
    if (otpSent) setOtpTimer(120); // 2 minutes
  }, [otpSent]);
  useEffect(() => {
    if (!otpSent || otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", color: "#222", borderRadius: 16, padding: 32, minWidth: 320,
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)", position: "relative"
      }}>
        <h2>Teacher Registration</h2>
        <form onSubmit={otpSent ? handleSubmit : handleSendOtp}>
          <input type="text" name="name" placeholder="Teacher Name" value={form.name} onChange={handleChange} required disabled={otpSent} style={inputStyle} />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required disabled={otpSent} style={inputStyle} />
          {!otpSent ? (
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? "Sending OTP..." : "Send OTP"}</button>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                {otpBlocks.map((v, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={e => handleOtpBlockChange(i, e.target.value)}
                    onKeyDown={e => handleOtpBlockKeyDown(i, e)}
                    style={{ width: 36, height: 36, textAlign: 'center', fontSize: 20, borderRadius: 6, border: '1px solid #ccc' }}
                  />
                ))}
              </div>
              {otpSent && (
                <div style={{ marginBottom: 8, color: otpTimer > 0 ? '#1e3c72' : '#c00', fontWeight: 600 }}>
                  {otpTimer > 0 ? `OTP expires in ${Math.floor(otpTimer/60)}:${(otpTimer%60).toString().padStart(2,'0')}` : 'OTP expired'}
                </div>
              )}
              <input type="hidden" name="otp" value={otpBlocks.join("")} />
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={form.password} onChange={handleChange} required style={inputStyle} maxLength={30} />
                <span onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: 14, cursor: 'pointer', userSelect: 'none', color: '#888', fontSize: 18 }} title={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
              {form.password && getPasswordSuggestions(form.password).length > 0 && (
                <div style={{ color: '#c00', fontSize: 13, marginTop: 4 }}>
                  Password must contain: {getPasswordSuggestions(form.password).join(', ')}
                </div>
              )}
              <button type="submit" disabled={!otpSent || otpTimer <= 0} style={btnStyle}>{loading ? "Registering..." : "Register"}</button>
              {otpSent && otpTimer <= 0 && (
                <button type="button" onClick={handleSendOtp} style={{ marginTop: 8, color: '#1e3c72', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</button>
              )}
            </>
          )}
        </form>
        {msg && <div style={{ color: "#0a0", marginTop: 12 }}>{msg}</div>}
        {error && <div style={{ color: "#f00", marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}

