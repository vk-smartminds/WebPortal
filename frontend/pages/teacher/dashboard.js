"use client";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from "react";
import { FaClipboardList, FaNewspaper, FaChartBar, FaBookOpen, FaBullhorn, FaCalendarAlt, FaEnvelope, FaLaptop, FaUser, FaTrashAlt } from "react-icons/fa";
import ProfileMenu from '../ProfileMenu'; // If you want to use the same ProfileMenu as admin
import { BASE_API_URL } from '../apiurl.js';
import { getToken, logout } from "../../utils/auth.js";
import ProtectedRoute from '../../components/ProtectedRoute';

// Sidebar component for Teacher with feature buttons (always visible, no hamburger)
function TeacherSidebar({ userEmail, userPhoto, userName, onMenuSelect, selectedMenu, onLogout }) {
  const menuItems = [
    { key: "test-generator", label: "Test Generator", icon: <FaClipboardList style={{ fontSize: 18 }} /> },
    { key: "cbse-updates", label: "CBSE Updates", icon: <FaNewspaper style={{ fontSize: 18 }} /> },
    { key: "student-performance", label: "Student Performance", icon: <FaChartBar style={{ fontSize: 18 }} /> },
    { key: "book-solutions", label: "Book Solutions", icon: <FaBookOpen style={{ fontSize: 18 }} /> },
    { key: "announcements", label: "Announcements", icon: <FaBullhorn style={{ fontSize: 18 }} /> },
    { key: "timetable", label: "Timetable", icon: <FaCalendarAlt style={{ fontSize: 18 }} /> },
    { key: "messages", label: "Messages", icon: <FaEnvelope style={{ fontSize: 18 }} /> },
    { key: "resources", label: "Digital Resources", icon: <FaLaptop style={{ fontSize: 18 }} /> },
    { key: "profile", label: "Profile", icon: <FaUser style={{ fontSize: 18 }} /> },
    { key: "delete-account", label: "Delete Account", icon: <span style={{fontSize:18, color:'#c00'}}>🗑️</span> }
  ];
  return (
    <aside style={{
      width: 260,
      background: "#fff",
      borderRight: "1px solid #e0e0e0",
      minHeight: "100vh",
      padding: "32px 0 0 0",
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 2000,
      boxShadow: "2px 0 16px rgba(30,60,114,0.07)",
      overflow: "hidden"
    }}>
      <div style={{ padding: "0 24px", marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6, alignSelf: "flex-start", color: "#1e3c72" }}>Teacher Panel</div>
        <img
          src={userPhoto || "/default-avatar.png"}
          alt="Profile"
          style={{ width: 72, height: 72, borderRadius: "50%", margin: "14px 0", objectFit: "cover", boxShadow: "0 2px 8px rgba(30,60,114,0.10)" }}
        />
        {userName && <div style={{ fontWeight: 600, fontSize: 16, color: "#1e3c72", marginBottom: 2 }}>{userName}</div>}
        <div style={{ fontSize: 14, color: "#888", marginBottom: 6 }}>{userEmail}</div>
      </div>
      <nav>
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={() => { onMenuSelect(item.key); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              background: selectedMenu === item.key ? "linear-gradient(90deg,#e0e7ff 0%,#f7fafd 100%)" : "none",
              border: "none",
              textAlign: "left",
              padding: "14px 28px",
              fontSize: 17,
              color: selectedMenu === item.key ? "#1e3c72" : "#444",
              cursor: "pointer",
              fontWeight: 600,
              borderLeft: selectedMenu === item.key ? "4px solid #1e3c72" : "4px solid transparent",
              transition: "background 0.18s, color 0.18s"
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <button
        onClick={onLogout}
        style={{
          margin: "32px 0 0 0",
          width: "80%",
          background: "#ff0080",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 0",
          fontWeight: 600,
          cursor: "pointer",
          alignSelf: "center"
        }}
      >
        Logout
      </button>
    </aside>
  );
}

function PhoneInputBoxes({ value, onChange }) {
  const inputsRef = React.useRef([]);
  const handleInput = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 1);
    let newValue = value.split('');
    newValue[idx] = val;
    newValue = newValue.join('').slice(0, 10);
    onChange(newValue);
    if (val && idx < 9 && inputsRef.current[idx + 1]) {
      inputsRef.current[idx + 1].focus();
    }
  };
  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      if (inputsRef.current[idx - 1]) inputsRef.current[idx - 1].focus();
    }
  };
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[...Array(10)].map((_, i) => (
        <input
          key={i}
          ref={el => inputsRef.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={e => handleInput(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          style={{
            width: 32, height: 40, textAlign: "center", fontSize: 18,
            border: "1.5px solid #e0e0e0", borderRadius: 6
          }}
        />
      ))}
    </div>
  );
}

function TeacherDashboard() {
  const [selectedMenu, setSelectedMenu] = useState("test-generator");
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', school: '', class: '', photo: null });
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = React.useRef();

  // Add userPhoto state to track the current photo for sidebar
  const [userPhoto, setUserPhoto] = useState('');
  const [userName, setUserName] = useState("");

  const router = useRouter();

  // Logout handler using router.push for consistency
  const handleLogout = useCallback(() => {
    logout();
    router.push("/Login");
  }, [router]);

  // Fetch profile on mount and when userEmail changes (not just when profile menu is selected)
  const fetchProfile = useCallback(() => {
    if (userEmail) {
      fetch(`${BASE_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setProfile(data.user);
          setUserName(data.user.name || "");
          setForm({
            name: data.user.name || '',
            phone: data.user.phone || '',
            school: data.user.school || '',
            class: data.user.class || '',
            photo: null
          });
          const photoUrl = data.user.photo && data.user.photo !== "" ? data.user.photo : "/default-avatar.png";
          setPreview(photoUrl);
          setUserPhoto(data.user.photo && data.user.photo !== "" ? data.user.photo : "");
        })
        .catch(() => {
          setProfile(null);
          setUserName("");
          setUserPhoto('');
        });
    }
  }, [userEmail]);

  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail") || "");
  }, []);

  // Fetch profile on mount and whenever userEmail changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch profile again when switching to profile tab (to ensure latest data after edit)
  useEffect(() => {
    if (selectedMenu === "profile" && userEmail) {
      fetchProfile();
    }
  }, [selectedMenu, userEmail, fetchProfile]);

  // Show preview when photo changes
  useEffect(() => {
    if (form.photo) {
      const url = URL.createObjectURL(form.photo);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [form.photo]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      school: profile?.school || '',
      class: profile?.class || '',
      photo: null
    });
    setPreview(profile?.photo || "/default-avatar.png");
    setStatus('');
  };
  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === "photo" && files && files[0]) {
      setForm(f => ({ ...f, photo: files[0] }));
    } else if (name === "phone") {
      setForm(f => ({ ...f, phone: value.replace(/\D/g, '').slice(0, 10) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };
  const handleSave = async () => {
    setStatus('Saving...');
    try {
      let body;
      let headers;
      if (form.photo) {
        body = new FormData();
        body.append('name', form.name);
        body.append('phone', form.phone);
        body.append('school', form.school);
        body.append('class', form.class);
        body.append('photo', form.photo);
        headers = { 'Authorization': `Bearer ${getToken()}` };
      } else {
        body = JSON.stringify({
          name: form.name,
          phone: form.phone,
          school: form.school,
          class: form.class
        });
        headers = {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        };
      }
      const res = await fetch(`${BASE_API_URL}/profile`, {
        method: 'PUT',
        headers,
        body
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setEditMode(false);
        setStatus('Profile updated!');
        setPreview(data.user.photo || "/default-avatar.png");
        setUserPhoto(data.user.photo && data.user.photo !== "" ? data.user.photo : "");
        fetchProfile(); // Ensure sidebar photo updates after save
      } else {
        setStatus(data.message || 'Failed to update profile');
      }
    } catch {
      setStatus('Failed to update profile');
    }
  };

  // On mount, verify token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/Login");
      return;
    }
    fetch(`${BASE_API_URL}/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          localStorage.clear();
          router.replace("/Login");
        }
      })
      .catch(() => {
        localStorage.clear();
        router.replace("/Login");
      });
  }, []);

  // Main content based on selected menu
  const renderContent = () => {
    if (selectedMenu === "profile") {
      if (!profile) {
        return (
          <div style={{ padding: 32 }}>
            <h2>Profile</h2>
            <p>Loading profile...</p>
          </div>
        );
      }
      if (editMode) {
        return (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(30,60,114,0.10)",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              background: "#fff",
              borderRadius: 24,
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.13)",
              padding: 36,
              maxWidth: 420,
              width: "95vw",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <h2 style={{
                marginBottom: 18,
                fontWeight: 700,
                fontSize: 26,
                color: "#1e3c72",
                letterSpacing: 0.5
              }}>Edit Profile</h2>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                width: "100%"
              }}>
                <div style={{ position: "relative" }}>
                  <img
                    src={preview || "/default-avatar.png"}
                    alt="Profile"
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: 8,
                      border: "3px solid #e0e0e0",
                      boxShadow: "0 2px 12px rgba(30,60,114,0.08)"
                    }}
                  />
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}
                  >📷</button>
                </div>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontWeight: 600, color: "#1e3c72" }}>Name:</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 6,
                        border: "1.5px solid #e0e0e0",
                        fontSize: 16,
                        marginTop: 4
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "#1e3c72" }}>Phone:</label>
                    <PhoneInputBoxes
                      value={form.phone || ""}
                      onChange={val => setForm(f => ({ ...f, phone: val }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, color: "#1e3c72" }}>School:</label>
                    <input
                      name="school"
                      value={form.school}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 6,
                        border: "1.5px solid #e0e0e0",
                        fontSize: 16,
                        marginTop: 4
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                  <button
                    onClick={handleSave}
                    style={{
                      padding: "10px 32px",
                      borderRadius: 8,
                      background: "linear-gradient(90deg,#28a745 0%,#20c997 100%)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(30,60,114,0.08)",
                      transition: "background 0.2s"
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: "10px 32px",
                      borderRadius: 8,
                      background: "#bbb",
                      color: "#222",
                      border: "none",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(30,60,114,0.08)",
                      transition: "background 0.2s"
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {status && <div style={{ marginTop: 10, color: "#1e3c72" }}>{status}</div>}
              </div>
            </div>
          </div>
        );
      }
      // Profile details view
      return (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(30,60,114,0.10)",
          zIndex: 3000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 24,
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.13)",
            padding: 36,
            maxWidth: 420,
            width: "95vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h2 style={{
              marginBottom: 18,
              fontWeight: 700,
              fontSize: 26,
              color: "#1e3c72",
              letterSpacing: 0.5
            }}>Profile Details</h2>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              width: "100%"
            }}>
              <div style={{ position: "relative" }}>
                <img
                  src={preview || "/default-avatar.png"}
                  alt="Profile"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: 8,
                    border: "3px solid #e0e0e0",
                    boxShadow: "0 2px 12px rgba(30,60,114,0.08)"
                  }}
                />
              </div>
              <div style={{
                width: "100%",
                background: "#f7fafd",
                borderRadius: 12,
                padding: "18px 20px",
                boxShadow: "0 2px 8px rgba(30,60,114,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 600, color: "#1e3c72", minWidth: 80 }}>Name:</span>
                  <span style={{ color: "#222", fontSize: 16 }}>{profile.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 600, color: "#1e3c72", minWidth: 80 }}>Email:</span>
                  <span style={{ color: "#222", fontSize: 16 }}>{profile.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 600, color: "#1e3c72", minWidth: 80 }}>Phone:</span>
                  <span style={{ color: "#222", fontSize: 16 }}>{profile.phone || "-"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 600, color: "#1e3c72", minWidth: 80 }}>School:</span>
                  <span style={{ color: "#222", fontSize: 16 }}>{profile.school || "-"}</span>
                </div>
              </div>
              <button
                onClick={handleEdit}
                style={{
                  marginTop: 18,
                  padding: "10px 32px",
                  borderRadius: 8,
                  background: "linear-gradient(90deg,#1e3c72 0%,#2a5298 100%)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(30,60,114,0.08)",
                  transition: "background 0.2s"
                }}
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedMenu("test-generator")}
                style={{
                  marginTop: 10,
                  padding: "10px 32px",
                  borderRadius: 8,
                  background: "#bbb",
                  color: "#222",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(30,60,114,0.08)",
                  transition: "background 0.2s"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (selectedMenu === "delete-account") {
      return (
        <>
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(30,60,114,0.10)",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              background: "#fff",
              borderRadius: 24,
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.13)",
              padding: 36,
              maxWidth: 420,
              width: "95vw",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <FaTrashAlt style={{ fontSize: 48, color: "#c00", marginBottom: 18 }} />
              <h2 style={{
                marginBottom: 12,
                fontWeight: 700,
                fontSize: 26,
                color: "#c00",
                letterSpacing: 0.5
              }}>Delete Account</h2>
              <div style={{ color: "#c00", fontWeight: 600, marginBottom: 18, textAlign: "center" }}>
                Are you sure you want to delete your account?<br />This action cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <button
                  style={{
                    padding: "10px 32px",
                    borderRadius: 8,
                    background: "#c00",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  <FaTrashAlt style={{ fontSize: 18, marginBottom: -2 }} />
                  Delete Account
                </button>
                <button
                  style={{
                    padding: "10px 32px",
                    borderRadius: 8,
                    background: "#bbb",
                    color: "#222",
                    border: "none",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedMenu("profile")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          {showDeleteModal && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.25)",
              zIndex: 4000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{
                background: "#fff",
                borderRadius: 20,
                padding: 36,
                minWidth: 340,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}>
                <FaTrashAlt style={{ fontSize: 54, color: "#c00", marginBottom: 18 }} />
                <div style={{ fontWeight: 700, fontSize: 22, color: "#c00", marginBottom: 12 }}>
                  Confirm Account Deletion
                </div>
                <div style={{ color: "#333", marginBottom: 28, fontSize: 16 }}>
                  This action is <b>permanent</b>.<br />Do you really want to delete your account?
                </div>
                <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
                  <button
                    style={{
                      padding: "10px 32px",
                      borderRadius: 8,
                      background: "#c00",
                      color: "#fff",
                      border: "none",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                    onClick={async () => {
                      const res = await fetch(`${BASE_API_URL}/user/delete`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: userEmail })
                      });
                      if (res.ok) {
                        localStorage.clear();
                        window.location.href = "/Login";
                      } else {
                        alert("Failed to delete account.");
                        setShowDeleteModal(false);
                      }
                    }}
                  >
                    <FaTrashAlt style={{ fontSize: 18, marginBottom: -2 }} />
                    Yes, Delete
                  </button>
                  <button
                    style={{
                      padding: "10px 32px",
                      borderRadius: 8,
                      background: "#bbb",
                      color: "#222",
                      border: "none",
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: "pointer"
                    }}
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }
    // Main content for other menu items
    return (
      <div style={{
        padding: 48,
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 4px 24px rgba(30,60,114,0.08)",
          padding: "48px 32px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center"
        }}>
          <h2 style={{
            fontWeight: 700,
            fontSize: 28,
            marginBottom: 16,
            letterSpacing: 1,
            color: "#1e3c72"
          }}>
            {{
              "test-generator": "Test Generator",
              "cbse-updates": "CBSE Updates",
              "student-performance": "Student Performance",
              "book-solutions": "Book Solutions",
              "announcements": "Announcements",
              "timetable": "Timetable",
              "messages": "Messages",
              "resources": "Digital Resources"
            }[selectedMenu] || "Welcome"}
          </h2>
          <p style={{
            fontSize: "1.1rem",
            marginBottom: 32,
            color: "#444"
          }}>
            Feature coming soon.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fa", flexDirection: "column" }}>
      <div style={{ display: "flex", flex: 1 }}>
        <TeacherSidebar
          userEmail={userEmail}
          userPhoto={userPhoto}
          userName={userName}
          onMenuSelect={setSelectedMenu}
          selectedMenu={selectedMenu}
          onLogout={handleLogout}
        />
        <main style={{ marginLeft: 260, flex: 1, minHeight: "100vh", background: "#f4f7fa", transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)" }}>
          {renderContent()}
        </main>
      </div>
      <footer style={{
        width: "100%",
        background: "#1e3c72",
        color: "#fff",
        textAlign: "center",
        padding: "18px 0",
        fontSize: 15,
        letterSpacing: 0.5,
        boxShadow: "0 -2px 12px rgba(30,60,114,0.08)",
        position: "relative"
      }}>
        © {new Date().getFullYear()} VK Teacher Portal. All rights reserved. | Demo Footer Info
      </footer>
    </div>
  );
}

export default function TeacherDashboardPage(props) {
  return (
    <ProtectedRoute>
      <TeacherDashboard {...props} />
    </ProtectedRoute>
  );
}