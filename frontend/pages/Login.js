"use client";
import React, { useState, useRef, useEffect } from "react";
// import Register from "./Register"; // Remove this import
import { useRouter } from "next/navigation";
import { BASE_API_URL } from "./apiurl";
import { setToken, setUserData, getToken, isAuthenticated, isTokenExpired } from "../utils/auth.js";

export default function Login() {
  const [mode, setMode] = useState("password"); // "password" or "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [showNotFoundPopup, setShowNotFoundPopup] = useState(false);
  const [isAdminOtp, setIsAdminOtp] = useState(false);
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false); // <-- new state
  const [showPassword, setShowPassword] = useState(false);
  const [otpBlocks, setOtpBlocks] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const router = useRouter();
  const [otpTimer, setOtpTimer] = useState(0);

  // When OTP is sent, start timer
  useEffect(() => {
    if (otpSent) setOtpTimer(120); // 2 minutes
  }, [otpSent]);
  useEffect(() => {
    if (!otpSent || otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  // Focus first OTP input when OTP is sent
  useEffect(() => {
    if (otpSent && otpRefs[0].current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        otpRefs[0].current.focus();
      }, 100);
    }
  }, [otpSent]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const token = getToken();
    if (isAuthenticated() && !isTokenExpired(token)) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role && payload.role.toLowerCase();
        if (role === 'admin') router.replace('/admin/dashboard');
        else if (role === 'student') router.replace('/student/dashboard');
        else if (role === 'teacher') router.replace('/teacher/dashboard');
        else if (role === 'parent') router.replace('/parent/dashboard');
        else router.replace('/login');
      } catch {}
    }
  }, [router]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    const cleanEmail = email.trim().toLowerCase();
    // DO NOT lowercase or trim the password!
    const cleanPassword = password; // <-- use as-is

    // --- SECURE ADMIN LOGIN CHECK FIRST ---
    let adminNotFound = false;
    try {
      const adminRes = await fetch(`${BASE_API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }) // <-- use cleanPassword
      });
      if (adminRes.ok) {
        const data = await adminRes.json();
        setToken(data.token); // <-- Store admin JWT
        setUserData(data.admin); // <-- Store admin data
        localStorage.setItem("userEmail", cleanEmail);
        setMsg("Admin login successful!");
        setError("");
        // Use push for navigation and ensure it happens after state updates
        router.push("/admin/dashboard");
        return;
      }
      if (adminRes.status === 404) {
        adminNotFound = true;
        // Do not return here, check user table next
      }
      if (adminRes.status === 401) {
        setError("Incorrect password.");
        return;
      }
      // If unauthorized, continue to user login
    } catch (err) {
      // Ignore admin check errors, fallback to user table check
    }
    // --- END ADMIN LOGIN CHECK ---

    // --- USER TABLE CHECK ---
    try {
      const res = await fetch(`${BASE_API_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }) // <-- use cleanPassword
      });
      if (res.status === 404) {
        // Only show not found if admin was also not found
        if (adminNotFound) {
          setError("");
          setShowNotFoundPopup(true);
        }
        return;
      }
      if (res.status === 401) {
        setError("Incorrect password.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        console.log('LOGIN RESPONSE:', data); // Debug log
        setMsg("Login successful!");
        setError("");
        setToken(data.token); // <-- Store user JWT
        setUserData(data.user); // <-- Store user data
        localStorage.setItem("userEmail", cleanEmail);
        // Debug: log token and user
        console.log('STORED TOKEN:', getToken());
        console.log('STORED USER:', localStorage.getItem('user_data'));
        // Redirect to dashboard based on user type, after a short delay to ensure storage is flushed
        if (data.user && data.user.registeredAs && data.token) {
          const role = data.user.registeredAs.toLowerCase();
          setTimeout(() => {
            if (role === "student") {
              router.replace("/student/dashboard");
            } else if (role === "teacher") {
              router.replace("/teacher/dashboard");
            } else if (role === "parent") {
              router.replace("/parent/dashboard");
            } else {
              router.replace("/login");
            }
          }, 100);
        } else {
          router.replace("/login");
        }
      } else {
        const data = await res.json();
        setError(data.message || "Login failed.");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
    // --- END USER TABLE CHECK ---
  };

  const handleSendOtp = async () => {
    setError("");
    setMsg("");
    setIsAdminOtp(false);
    setOtpSent(false);
    setAdminOtpSent(false);
    setSendingOtp(true); // <-- show loading
    // Clear the OTP blocks when sending new OTP
    setOtpBlocks(["", "", "", "", "", ""]);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check in Admin table
    try {
      const adminRes = await fetch(`${BASE_API_URL}/getadmins`);
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        const foundAdmin = (adminData.admins || []).find(a => a.email === cleanEmail);
        if (foundAdmin) {
          // Send OTP to admin email (reuse user OTP endpoint for now)
          const sendOtpRes = await fetch(`${BASE_API_URL}/user/send-login-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail })
          });
          setSendingOtp(false); // <-- stop loading
          if (sendOtpRes.ok) {
            setIsAdminOtp(true);
            setOtpSent(true);
            setAdminOtpSent(true);
            setMsg("OTP sent to your email.");
          } else {
            const data = await sendOtpRes.json();
            setError(data.message || "Failed to send OTP.");
          }
          return;
        }
      }
    } catch (err) {
      // Ignore admin check errors, fallback to user table check
    }

    // 2. Check in User table
    try {
      const userRes = await fetch(`${BASE_API_URL}/user/find-by-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });
      if (userRes.ok) {
        // User exists, send OTP
        const sendOtpRes = await fetch(`${BASE_API_URL}/user/send-login-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail })
        });
        setSendingOtp(false); // <-- stop loading
        if (sendOtpRes.ok) {
          setOtpSent(true);
          setMsg("OTP sent to your email.");
        } else {
          const data = await sendOtpRes.json();
          setError(data.message || "Failed to send OTP.");
        }
      } else if (userRes.status === 404) {
        setSendingOtp(false); // <-- stop loading
        setError("");
        setShowNotFoundPopup(true);
      } else {
        setSendingOtp(false); // <-- stop loading
        const data = await userRes.json();
        setError(data.message || "Failed to check user.");
      }
    } catch (err) {
      setSendingOtp(false); // <-- stop loading
      setError("Failed to send OTP. Please try again.");
    }
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

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    const cleanEmail = email.trim().toLowerCase();

    if (!otpSent) {
      setError("Please click on Send OTP first.");
      return;
    }

    if (isAdminOtp && adminOtpSent) {
      // Verify OTP for admin (reuse user OTP endpoint for now)
      try {
        const res = await fetch(`${BASE_API_URL}/user/verify-login-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, otp: otpBlocks.join("") })
        });
        if (res.ok) {
          // Fetch isSuperAdmin info
          const superRes = await fetch(`${BASE_API_URL}/check-superadmin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail })
          });
          let isSuperAdmin = false;
          if (superRes.ok) {
            const superData = await superRes.json();
            isSuperAdmin = !!superData.isSuperAdmin;
          }
          localStorage.setItem("userEmail", cleanEmail);
          localStorage.setItem("isSuperAdmin", isSuperAdmin ? "true" : "false");
          setMsg("Admin login successful!");
          setError("");
          router.replace("/admin/dashboard");
        } else {
          const data = await res.json();
          setError(data.message || "Invalid OTP.");
        }
      } catch (err) {
        setError("Admin OTP login failed.");
      }
      return;
    }

    // --- USER TABLE CHECK ---
    try {
      const res = await fetch(`${BASE_API_URL}/user/verify-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: otpBlocks.join("") })
      });
      if (res.ok) {
        const data = await res.json();
        setMsg("OTP login successful!");
        setError("");
        setToken(data.token); // <-- Store user JWT
        setUserData(data.user); // <-- Store user data
        localStorage.setItem("userEmail", cleanEmail);
        // Debug: log token and user
        // console.log('OTP login:', data.token, data.user);
        // Redirect to dashboard based on user type
        if (data.user && data.user.registeredAs) {
          const role = data.user.registeredAs.toLowerCase();
          if (role === "student") {
            router.replace("/student/dashboard");
          } else if (role === "teacher") {
            router.replace("/teacher/dashboard");
          } else if (role === "parent") {
            router.replace("/parent/dashboard");
          } else {
            router.replace("/login");
          }
        } else {
          router.replace("/login");
        }
      } else {
        const data = await res.json();
        setError(data.message || "Invalid OTP.");
      }
    } catch (err) {
      setError("OTP login failed. Please try again.");
    }
    // --- END USER TABLE CHECK ---
  };

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
        padding: "32px 32px",
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
        textAlign: "center",
        maxWidth: 700,
        minWidth: 600,
        minHeight: 340,
        margin: "0 auto",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 32
      }}>
        {/* Left side: Login method selection and Register */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start"
        }}>
          <div style={{
            background: "#fff",
            color: "#1e3c72",
            borderRadius: 12,
            width: 120,
            margin: "0 auto 18px auto",
            fontWeight: 700,
            fontSize: "1.2rem",
            padding: "10px 0",
            boxShadow: "0 2px 8px rgba(30,60,114,0.08)"
          }}>
            Login
          </div>
          <div style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            marginBottom: 18,
            gap: 0
          }}>
            <button
              style={{
                background: mode === "password" ? "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)" : "#f0f0f0",
                color: mode === "password" ? "#fff" : "#1e3c72",
                border: "none",
                borderRadius: "8px 0 0 8px",
                padding: "12px 12px",
                fontWeight: 700,
                fontSize: "1.05rem",
                cursor: "pointer",
                width: 120
              }}
              onClick={() => setMode("password")}
            >
              Email & Password
            </button>
            <button
              style={{
                background: mode === "otp" ? "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)" : "#f0f0f0",
                color: mode === "otp" ? "#fff" : "#1e3c72",
                border: "none",
                borderRadius: "0 8px 8px 0",
                padding: "12px 12px",
                fontWeight: 700,
                fontSize: "1.05rem",
                cursor: "pointer",
                width: 120
              }}
              onClick={() => setMode("otp")}
            >
              Email & OTP
            </button>
          </div>
          <div style={{
            fontWeight: 700,
            color: "#1e3c72",
            fontSize: "1.1rem",
            margin: "10px 0"
          }}>
            <span style={{
              display: "inline-block",
              borderTop: "1px solid #ccc",
              width: 40,
              verticalAlign: "middle",
              marginRight: 8
            }}></span>
            OR
            <span style={{
              display: "inline-block",
              borderTop: "1px solid #ccc",
              width: 40,
              verticalAlign: "middle",
              marginLeft: 8
            }}></span>
          </div>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            marginTop: 32,
            width: 120,
            marginLeft: "auto",
            marginRight: "auto",
            boxShadow: "0 2px 8px rgba(30,60,114,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <button
              onClick={() => setShowRegister(true)}
              style={{
                background: "transparent",
                color: "#1e3c72",
                border: "none",
                borderRadius: 12,
                padding: "14px 0",
                fontWeight: 600,
                fontSize: "1.1rem",
                width: "100%",
                cursor: "pointer"
              }}
            >
              Register
            </button>
          </div>
        </div>
        {/* Right side: Login form */}
        <div style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} style={{ width: "100%" }}>
              <div style={{
                background: "#f7f7f7",
                borderRadius: 10,
                margin: "0 auto 16px auto",
                padding: "16px 0",
                width: 260,
                boxShadow: "0 1px 4px rgba(30,60,114,0.06)"
              }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: "85%",
                    padding: "10px",
                    margin: "8px 0",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    fontSize: "1rem"
                  }}
                /><br />
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: "85%",
                    padding: "10px",
                    margin: "8px 0",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    fontSize: "1rem"
                  }}
                />
                <span
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 18, top: 18, cursor: 'pointer', userSelect: 'none', color: '#888', fontSize: 18 }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
              <div style={{
                background: "#f7f7f7",
                borderRadius: 10,
                margin: "0 auto 16px auto",
                padding: "16px 0",
                width: 260,
                boxShadow: "0 1px 4px rgba(30,60,114,0.06)"
              }}>
                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 28px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "85%"
                  }}
                >
                  Login
                </button>
              </div>
              {msg && <div style={{ color: "#0f0", marginTop: 12 }}>{msg}</div>}
              {error && <div style={{ color: "#f66", marginTop: 12 }}>{error}</div>}
            </form>
          )}
          {mode === "otp" && (
            <form onSubmit={handleOtpLogin} style={{ width: "100%" }}>
              <div style={{
                background: "#f7f7f7",
                borderRadius: 10,
                margin: "0 auto 16px auto",
                padding: "16px 0",
                width: 260,
                boxShadow: "0 1px 4px rgba(30,60,114,0.06)"
              }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: "85%",
                    padding: "10px",
                    margin: "8px 0",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    fontSize: "1rem"
                  }}
                  disabled={otpSent || sendingOtp}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !otpSent && !sendingOtp) {
                      e.preventDefault();
                      setError("Please click on Send OTP first.");
                    }
                  }}
                /><br />
              </div>
              {!otpSent ? (
                <div style={{
                  background: "#f7f7f7",
                  borderRadius: 10,
                  margin: "0 auto 16px auto",
                  padding: "16px 0",
                  width: 260,
                  boxShadow: "0 1px 4px rgba(30,60,114,0.06)"
                }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{
                      background: "#ff0080",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 24px",
                      fontWeight: 600,
                      cursor: sendingOtp ? "not-allowed" : "pointer",
                      width: "85%"
                    }}
                    disabled={sendingOtp}
                  >
                    {sendingOtp ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
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
                  <input type="hidden" name="otp" value={otpBlocks.join("")} />
                  <div style={{ marginBottom: 8, color: otpTimer > 0 ? '#1e3c72' : '#c00', fontWeight: 600 }}>
                    {otpTimer > 0 ? `OTP expires in ${Math.floor(otpTimer/60)}:${(otpTimer%60).toString().padStart(2,'0')}` : 'OTP expired'}
                  </div>
                  <div style={{
                    background: "#f7f7f7",
                    borderRadius: 10,
                    margin: "0 auto 16px auto",
                    padding: "16px 0",
                    width: 260,
                    boxShadow: "0 1px 4px rgba(30,60,114,0.06)"
                  }}>
                    <button
                      type="submit"
                      style={{
                        background: "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 28px",
                        fontSize: "1rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        width: "85%"
                      }}
                      disabled={!otpSent || otpTimer <= 0}
                    >
                      Login with OTP
                    </button>
                  </div>
                  {otpSent && otpTimer <= 0 && (
                    <button type="button" onClick={handleSendOtp} style={{ marginTop: 8, color: '#1e3c72', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Resend OTP</button>
                  )}
                </>
              )}
              {msg && <div style={{ color: "#0f0", marginTop: 12 }}>{msg}</div>}
              {error && <div style={{ color: "#f66", marginTop: 12 }}>{error}</div>}
            </form>
          )}
        </div>
      </div>
      {/* Register Modal: Choose type */}
      {showRegister && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000
        }}>
          <div style={{
            background: "#fff",
            color: "#222",
            borderRadius: 16,
            padding: 32,
            minWidth: 320,
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            textAlign: "center"
          }}>
            <div style={{ marginBottom: 18, fontWeight: 600, fontSize: "1.2rem" }}>
              Register as:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                onClick={() => { setShowRegister(false); router.push("/register-student"); }}
                style={{
                  background: "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer"
                }}
              >
                Student
              </button>
              <button
                onClick={() => { setShowRegister(false); router.push("/register-teacher"); }}
                style={{
                  background: "linear-gradient(90deg, #1e3c72 0%, #ff8c00 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer"
                }}
              >
                Teacher
              </button>
              <button
                onClick={() => { setShowRegister(false); router.push("/register-parent"); }}
                style={{
                  background: "linear-gradient(90deg, #ff0080 0%, #1e3c72 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer"
                }}
              >
                Parent
              </button>
              <button
                onClick={() => setShowRegister(false)}
                style={{
                  background: "#eee",
                  color: "#1e3c72",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 0",
                  fontWeight: 600,
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  marginTop: 8
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* NotFound Popup */}
      {showNotFoundPopup && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000
        }}>
          <div style={{
            background: "#fff",
            color: "#222",
            borderRadius: 16,
            padding: 32,
            minWidth: 320,
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            textAlign: "center"
          }}>
            <div style={{ marginBottom: 18, fontWeight: 500, fontSize: "1.1rem" }}>
              User not found. Do you want to register?
            </div>
            <button
              onClick={() => {
                setShowNotFoundPopup(false);
                setShowRegister(true);
              }}
              style={{
                background: "linear-gradient(90deg, #ff8c00 0%, #ff0080 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 24px",
                fontWeight: 600,
                cursor: "pointer",
                marginRight: 12
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setShowNotFoundPopup(false)}
              style={{
                background: "#eee",
                color: "#1e3c72",
                border: "none",
                borderRadius: 8,
                padding: "8px 24px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

