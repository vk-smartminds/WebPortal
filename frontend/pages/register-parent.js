"use client";
import React, { useState, useRef, useEffect } from "react";
import { BASE_API_URL } from "./apiurl";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, isTokenExpired } from "../utils/auth.js";

const btnStyle = {
  background: "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 0",
  fontSize: "1.1rem",
  fontWeight: 600,
  cursor: "pointer",
};
const inputStyle = {
  width: "100%",
  padding: 8,
  margin: "8px 0",
  borderRadius: 6,
  border: "1px solid #ccc",
};

export default function RegisterParent() {
  const [step, setStep] = useState(1);
  const [childEmail, setChildEmail] = useState("");
  const [childOtpBlocks, setChildOtpBlocks] = useState(["", "", "", "", "", ""]);
  const childOtpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [childOtpSent, setChildOtpSent] = useState(false);
  const [childOtpVerified, setChildOtpVerified] = useState(false);
  const [childOtpTimer, setChildOtpTimer] = useState(0);

  // Parent info
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentOtpBlocks, setParentOtpBlocks] = useState(["", "", "", "", "", ""]);
  const parentOtpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [parentOtpSent, setParentOtpSent] = useState(false);
  const [parentOtpVerified, setParentOtpVerified] = useState(false);
  const [parentOtpTimer, setParentOtpTimer] = useState(0);

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [showStudentRegister, setShowStudentRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    const token = getToken();
    if (isAuthenticated() && !isTokenExpired(token)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        if (role === 'admin') router.replace('/admin/dashboard');
        else if (role === 'student') router.replace('/student/dashboard');
        else if (role === 'teacher') router.replace('/teacher/dashboard');
        else if (role === 'parent') router.replace('/parent/dashboard');
        else router.replace('/login');
      } catch {}
    }
  }, [router]);
  
  useEffect(() => {
    if (childOtpSent) setChildOtpTimer(120); // 2 minutes
  }, [childOtpSent]);
  useEffect(() => {
    if (!childOtpSent || childOtpTimer <= 0) return;
    const interval = setInterval(() => setChildOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [childOtpSent, childOtpTimer]);
  useEffect(() => {
    if (parentOtpSent) setParentOtpTimer(120); // 2 minutes
  }, [parentOtpSent]);
  useEffect(() => {
    if (!parentOtpSent || parentOtpTimer <= 0) return;
    const interval = setInterval(() => setParentOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [parentOtpSent, parentOtpTimer]);

  // Step 1: Verify child email and send OTP
  const handleChildEmailSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_API_URL}/parent/verify-child-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childEmail: childEmail.trim().toLowerCase(),
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setChildOtpSent(true);
        setMsg("Child found. OTP sent to child email.");
      } else {
        setError(data.message || "Child verification failed");
        setShowStudentRegister(true); // Show register student option if not found
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  // Step 2: Verify OTP sent to child email
  const handleChildOtpVerify = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    const otp = childOtpBlocks.join("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP sent to child email.");
      setLoading(false);
      return;
    }
    // Verify OTP with backend
    try {
      const res = await fetch(`${BASE_API_URL}/parent/verify-child-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childEmail: childEmail.trim().toLowerCase(),
          otp
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setChildOtpVerified(true);
        setStep(2);
        setMsg("Child email verified. Please complete your registration.");
      } else {
        setError(data.message || "Invalid or expired OTP.");
      }
    } catch {
      setError("OTP verification failed. Please try again.");
    }
    setLoading(false);
  };

  // Step 2: Parent info and OTP
  const handleParentInfoSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    // Check if parent email already exists
    try {
      const checkRes = await fetch(`${BASE_API_URL}/user/find`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parentEmail.trim().toLowerCase() }),
      });
      if (checkRes.ok) {
        setError("Email already registered.");
        setLoading(false);
        return;
      }
    } catch {}
    // Send OTP to parent email
    try {
      const res = await fetch(`${BASE_API_URL}/user/send-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parentEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setParentOtpSent(true);
        setMsg("OTP sent to your email.");
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Failed to send OTP. Please try again.");
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

  const handleOtpBlockChange = (blocks, setBlocks, refs, idx, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newBlocks = [...blocks];
    newBlocks[idx] = val;
    setBlocks(newBlocks);
    if (val && idx < 5) refs[idx + 1].current.focus();
  };

  const handleOtpBlockKeyDown = (blocks, refs, idx, e) => {
    if (e.key === "Backspace" && !blocks[idx] && idx > 0) {
      refs[idx - 1].current.focus();
    }
  };

  const handleParentOtpVerifyAndRegister = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    // Verify OTP
    try {
      const res = await fetch(`${BASE_API_URL}/user/verify-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parentEmail.trim().toLowerCase(),
          otp: parentOtpBlocks.join(""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid or expired OTP.");
        setLoading(false);
        return;
      }
    } catch {
      setError("OTP verification failed. Please try again.");
      setLoading(false);
      return;
    }
    // Check password strength
    if (getPasswordSuggestions(parentPassword).length > 0) {
      setError('Password is not strong enough.');
      setLoading(false);
      return;
    }
    // Register parent
    try {
      const res = await fetch(`${BASE_API_URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parentName,
          email: parentEmail.trim().toLowerCase(),
          password: parentPassword,
          otp: parentOtpBlocks.join(""),
          registeredAs: "Parent",
          childEmail: childEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Registration successful! Redirecting...");
        // Store JWT and user data if provided
        if (data.token) {
          localStorage.setItem('jwt_token', data.token);
        }
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user));
        }
        localStorage.setItem("userEmail", parentEmail.trim().toLowerCase());
        setTimeout(() => {
          router.replace("/parent/dashboard");
        }, 1200);
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch {
      setError("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          color: "#222",
          borderRadius: 16,
          padding: 32,
          minWidth: 320,
          boxShadow:
            "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          position: "relative",
        }}
      >
        <h2>Parent Registration</h2>
        {step === 1 && (
          <form
            onSubmit={childOtpSent ? handleChildOtpVerify : handleChildEmailSubmit}
          >
            <input
              type="email"
              placeholder="Enter your child's registered email"
              value={childEmail}
              onChange={(e) => setChildEmail(e.target.value)}
              required
              disabled={childOtpSent}
              style={inputStyle}
            />
            {!childOtpSent ? (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  style={btnStyle}
                >
                  {loading ? "Verifying..." : "Verify Child Email"}
                </button>
                {/* Show Register Student option if student not found */}
                {showStudentRegister && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ color: "#c00", marginBottom: 8 }}>
                      Do you want to register the student?
                    </div>
                    <button
                      type="button"
                      style={{
                        ...btnStyle,
                        background: "linear-gradient(90deg, #1e3c72 0%, #ff0080 100%)",
                        width: "100%",
                      }}
                      onClick={() => {
                        setShowStudentRegister(false);
                        // Redirect to login page (as per your request)
                        window.location.href = "/Login";
                      }}
                    >
                      Register Student
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                  {childOtpBlocks.map((v, i) => (
                    <input
                      key={i}
                      ref={childOtpRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={v}
                      onChange={e => handleOtpBlockChange(childOtpBlocks, setChildOtpBlocks, childOtpRefs, i, e.target.value)}
                      onKeyDown={e => handleOtpBlockKeyDown(childOtpBlocks, childOtpRefs, i, e)}
                      style={{ width: 36, height: 36, textAlign: 'center', fontSize: 20, borderRadius: 6, border: '1px solid #ccc' }}
                    />
                  ))}
                </div>
                <input type="hidden" name="childOtp" value={childOtpBlocks.join("")} />
                <div style={{ marginBottom: 8, color: childOtpTimer > 0 ? '#1e3c72' : '#c00', fontWeight: 600 }}>
                  {childOtpTimer > 0 ? `OTP expires in ${Math.floor(childOtpTimer/60)}:${(childOtpTimer%60).toString().padStart(2,'0')}` : 'OTP expired'}
                </div>
                <button
                  type="submit"
                  disabled={!childOtpSent || childOtpTimer <= 0}
                  style={btnStyle}
                >
                  {loading ? "Verifying OTP..." : "Verify OTP"}
                </button>
                {childOtpSent && childOtpTimer <= 0 && (
                  <button type="button" onClick={handleChildEmailSubmit} style={{ marginTop: 8, color: '#1e3c72', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</button>
                )}
              </>
            )}
          </form>
        )}
        {step === 2 && (
          <form onSubmit={parentOtpSent ? handleParentOtpVerifyAndRegister : handleParentInfoSubmit}>
            <input
              type="text"
              placeholder="Parent Name"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              required
              disabled={parentOtpSent}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Parent Email"
              value={parentEmail}
              onChange={e => setParentEmail(e.target.value)}
              required
              disabled={parentOtpSent}
              style={inputStyle}
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={parentPassword}
                onChange={e => setParentPassword(e.target.value)}
                required
                style={inputStyle}
                disabled={parentOtpSent}
                maxLength={30}
              />
              <span
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: 14, cursor: 'pointer', userSelect: 'none', color: '#888', fontSize: 18 }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
            {parentPassword && getPasswordSuggestions(parentPassword).length > 0 && (
              <div style={{ color: '#c00', fontSize: 13, marginTop: 4 }}>
                Password must contain: {getPasswordSuggestions(parentPassword).join(', ')}
              </div>
            )}
            {!parentOtpSent ? (
              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? "Sending OTP..." : "Send OTP to Parent Email"}
              </button>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                  {parentOtpBlocks.map((v, i) => (
                    <input
                      key={i}
                      ref={parentOtpRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={v}
                      onChange={e => handleOtpBlockChange(parentOtpBlocks, setParentOtpBlocks, parentOtpRefs, i, e.target.value)}
                      onKeyDown={e => handleOtpBlockKeyDown(parentOtpBlocks, parentOtpRefs, i, e)}
                      style={{ width: 36, height: 36, textAlign: 'center', fontSize: 20, borderRadius: 6, border: '1px solid #ccc' }}
                    />
                  ))}
                </div>
                <input type="hidden" name="parentOtp" value={parentOtpBlocks.join("")} />
                <div style={{ marginBottom: 8, color: parentOtpTimer > 0 ? '#1e3c72' : '#c00', fontWeight: 600 }}>
                  {parentOtpTimer > 0 ? `OTP expires in ${Math.floor(parentOtpTimer/60)}:${(parentOtpTimer%60).toString().padStart(2,'0')}` : 'OTP expired'}
                </div>
                <button type="submit" disabled={!parentOtpSent || parentOtpTimer <= 0} style={btnStyle}>
                  {loading ? "Verifying & Registering..." : "Verify OTP & Register"}
                </button>
                {parentOtpSent && parentOtpTimer <= 0 && (
                  <button type="button" onClick={handleParentInfoSubmit} style={{ marginTop: 8, color: '#1e3c72', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</button>
                )}
              </>
            )}
          </form>
        )}
        {msg && (
          <div style={{ color: "#0a0", marginTop: 12 }}>{msg}</div>
        )}
        {error && (
          <div style={{ color: "#f00", marginTop: 12 }}>{error}</div>
        )}
      </div>
    </div>
  );
}

