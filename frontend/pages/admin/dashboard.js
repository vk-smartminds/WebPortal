"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaUsers, FaUserTie, FaBook, FaRegListAlt, FaCog, FaBullhorn, FaChartBar, FaUserShield, FaBars, FaTimes, FaUser } from "react-icons/fa";
import ProtectedRoute from '../../components/ProtectedRoute';
import { BASE_API_URL } from '../apiurl.js';
import { getUserData, getToken, isAuthenticated, isTokenExpired, logout } from "../../utils/auth.js";

function AdminSidebar({ userEmail, userPhoto, onMenuSelect, selectedMenu, isSuperAdmin, setShowAddAdmin, setShowRemoveAdmin, setShowViewAdmins }) {
  const menuItems = [
    ...(isSuperAdmin ? [
      { key: "add-admin", label: "Add Admin", icon: <FaUserShield style={{ fontSize: 18 }} />, action: () => setShowAddAdmin(true) },
      { key: "remove-admin", label: "Remove Admin", icon: <FaUserShield style={{ fontSize: 18, color: '#c0392b' }} />, action: () => setShowRemoveAdmin(true) },
      { key: "manage-users", label: "Manage Users", icon: <FaUsers style={{ fontSize: 18 }} /> },
    ] : []),
    { key: "view-admins", label: "View Admins", icon: <FaUsers style={{ fontSize: 18 }} />, action: () => setShowViewAdmins(true) },
    { key: "manage-books", label: "Manage Books", icon: <FaBook style={{ fontSize: 18 }} /> },
    { key: "records", label: "Records", icon: <FaRegListAlt style={{ fontSize: 18 }} /> },
    { key: "announcements", label: "Announcements", icon: <FaBullhorn style={{ fontSize: 18 }} /> },
    { key: "reports", label: "Reports", icon: <FaChartBar style={{ fontSize: 18 }} /> },
    { key: "settings", label: "Settings", icon: <FaCog style={{ fontSize: 18 }} /> },
    { key: "profile", label: "Profile", icon: <FaUser style={{ fontSize: 18 }} /> },
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
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6, alignSelf: "flex-start", color: "#1e3c72" }}>Admin Panel</div>
        <img
          src={userPhoto || "/default-avatar.png"}
          alt="Profile"
          style={{ width: 72, height: 72, borderRadius: "50%", margin: "14px 0", objectFit: "cover", boxShadow: "0 2px 8px rgba(30,60,114,0.10)" }}
        />
        <div style={{ fontSize: 14, color: "#888", marginBottom: 6 }}>{userEmail}</div>
      </div>
      <nav>
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={item.action ? item.action : () => { onMenuSelect(item.key); }}
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
        onClick={() => { logout(); window.location.href = "/login"; }}
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

function AdminDashboard() {
  const [selectedMenu, setSelectedMenu] = useState("manage-users");
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', school: '', class: '', photo: null });
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef();
  const [userPhoto, setUserPhoto] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showRemoveAdmin, setShowRemoveAdmin] = useState(false);
  const [showViewAdmins, setShowViewAdmins] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState({ email: "", isSuperAdmin: false });
  const [addStatus, setAddStatus] = useState("");
  const [removeEmail, setRemoveEmail] = useState("");
  const [removeStatus, setRemoveStatus] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [showRemoveImages, setShowRemoveImages] = useState(false);
  const [removeImagesAnnouncement, setRemoveImagesAnnouncement] = useState(null);
  const [removeImagesPreview, setRemoveImagesPreview] = useState([]);
  const [removeImagesToDelete, setRemoveImagesToDelete] = useState([]);
  const [removeImagesStatus, setRemoveImagesStatus] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState(null);
  const [removedImages, setRemovedImages] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [removingImage, setRemovingImage] = useState({ announcementId: null, imageIndex: null, loading: false });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // PhoneInputBoxes component for 10-digit phone input
  function PhoneInputBoxes({ value, onChange }) {
    const inputsRef = useRef([]);
    const handleInput = (e, idx) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 1);
      let newValue = value.split('');
      newValue[idx] = val;
      newValue = newValue.join('').slice(0, 10);
      onChange(newValue);
      // Move to next box if input
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

  // Fetch profile on mount and when userEmail changes
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
          setUserPhoto('');
        });
    }
  }, [userEmail]);

  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail") || "");
    setIsSuperAdmin(localStorage.getItem("isSuperAdmin") === "true");
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (selectedMenu === "profile" && userEmail) {
      fetchProfile();
    }
  }, [selectedMenu, userEmail, fetchProfile]);

  useEffect(() => {
    if (form.photo) {
      const url = URL.createObjectURL(form.photo);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [form.photo]);

  // Admin management logic
  // Fetch admin info for this user to check isSuperAdmin
  useEffect(() => {
    const user = getUserData();
    if (user && user.email) {
      setUserEmail(user.email);
      fetch(`${BASE_API_URL}/getadmins`)
        .then(res => res.json())
        .then(data => {
          const found = (data.admins || []).find(a => a.email === user.email);
          setIsSuperAdmin(found?.isSuperAdmin === true);
        })
        .catch(() => setIsSuperAdmin(false));
    }
  }, []);

  // Fetch admins when modal opens
  useEffect(() => {
    if (showViewAdmins) {
      fetch(`${BASE_API_URL}/getadmins`)
        .then(res => res.json())
        .then(data => setAdmins(data.admins || []))
        .catch(() => setAdmins([]));
    }
  }, [showViewAdmins]);

  // Add admin handler
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddStatus("Adding...");
    try {
      const res = await fetch(`${BASE_API_URL}/addadmins`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          email: adminForm.email,
          isSuperAdmin: adminForm.isSuperAdmin,
          requesterEmail: userEmail
        })
      });
      if (res.ok) {
        setAddStatus("Admin added!");
        setAdminForm({ email: "", isSuperAdmin: false });
      } else {
        const data = await res.json();
        setAddStatus(data.message || "Failed to add admin");
      }
    } catch {
      setAddStatus("Failed to add admin");
    }
  };

  // Remove admin handler
  const handleRemoveAdmin = async (e) => {
    e.preventDefault();
    setRemoveStatus("Removing...");
    try {
      const res = await fetch(`${BASE_API_URL}/removeadmin`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          email: removeEmail,
          requesterEmail: userEmail
        })
      });
      if (res.ok) {
        setRemoveStatus("Admin removed!");
        setRemoveEmail("");
      } else {
        const data = await res.json();
        setRemoveStatus(data.message || "Failed to remove admin");
      }
    } catch {
      setRemoveStatus("Failed to remove admin");
    }
  };

  const handleEdit = (announcement) => {
    setEditAnnouncement(announcement);
    setForm({ text: announcement.text, images: [] });
    setPreview(Array.isArray(announcement.images) ? [...announcement.images] : []);
    setRemovedImages([]);
    setShowEdit(true);
    setStatus('');
  };

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
        body.append('photo', form.photo);
        headers = { 'Authorization': `Bearer ${getToken()}` };
      } else {
        body = JSON.stringify({
          name: form.name,
          phone: form.phone
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
        fetchProfile();
        setSelectedMenu('manage-users');
      } else {
        setStatus(data.message || 'Failed to update profile');
      }
    } catch {
      setStatus('Failed to update profile');
    }
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    setSearchStatus("Searching...");
    setSearchedUser(null);
    setDeleteStatus("");
    try {
      const res = await fetch(`${BASE_API_URL}/admin/find-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ email: searchEmail, requesterEmail: userEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchedUser(data.user);
        setSearchStatus("");
      } else {
        const data = await res.json();
        setSearchedUser(null);
        setSearchStatus(data.message || "User not found");
      }
    } catch {
      setSearchedUser(null);
      setSearchStatus("Error searching user");
    }
  };

  const handleDeleteUser = async () => {
    setDeleteStatus("Deleting...");
    try {
      const res = await fetch(`${BASE_API_URL}/admin/delete-user`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ email: searchedUser.email, requesterEmail: userEmail })
      });
      if (res.ok) {
        setDeleteStatus("User deleted successfully.");
        setSearchedUser(null);
        setSearchEmail("");
        setTimeout(() => {
          setShowDeleteModal(false);
          setDeleteStatus("");
        }, 1200);
      } else {
        const data = await res.json();
        setDeleteStatus(data.message || "Failed to delete user");
      }
    } catch {
      setDeleteStatus("Failed to delete user");
    }
  };

  const handleFormChange = e => {
    const { name, value, files } = e.target;
    if (name === 'images' && files) {
      setForm(f => ({ ...f, images: Array.from(files) }));
      // Show previews for new images
      const filePreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreview(prev => Array.isArray(prev) ? [...prev, ...filePreviews] : filePreviews);
    } else if (name === 'text') {
      setForm(f => ({ ...f, text: value }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus('Updating...');
    try {
      const formData = new FormData();
      formData.append('text', form.text);
      if (form.images && form.images.length > 0) {
        for (let i = 0; i < form.images.length; i++) {
          formData.append('images', form.images[i]);
        }
      }
      if (removedImages.length > 0) {
        removedImages.forEach(idx => formData.append('removeImages', idx));
      }
      const res = await fetch(`${BASE_API_URL}/updateannouncement/${editAnnouncement._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Announcement updated!');
        setShowEdit(false);
        setEditAnnouncement(null);
        setForm({ text: '', images: [] });
        // Update the announcement in the state
        setAnnouncements(prev => prev.map(a => a._id === data.announcement._id ? data.announcement : a));
      } else {
        setStatus(data.message || 'Failed to update');
      }
    } catch {
      setStatus('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    setStatus('Deleting...');
    try {
      const res = await fetch(`${BASE_API_URL}/removeannouncement/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Deleted!');
        setDeleteConfirmId(null);
        // Remove the deleted announcement from the state
        setAnnouncements(prev => prev.filter(a => a._id !== data.id));
      } else {
        setStatus('Failed to delete');
      }
    } catch {
      setStatus('Failed to delete');
    }
  };

  const handleRemoveImage = (idx) => {
    setPreview(prev => Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : []);
    setRemovedImages(prev => [...prev, idx]);
  };

  // Open remove images modal
  const handleOpenRemoveImages = (announcement) => {
    console.log("open modal", announcement); // DEBUG: Check if handler is called
    setRemoveImagesAnnouncement(announcement);
    setRemoveImagesPreview(Array.isArray(announcement.images) ? [...announcement.images] : []);
    setRemoveImagesToDelete([]);
    setShowRemoveImages(true);
    setRemoveImagesStatus('');
  };

  // Remove image in remove images modal
  const handleRemoveImageInModal = (idx) => {
    setRemoveImagesPreview(prev => prev.filter((_, i) => i !== idx));
    setRemoveImagesToDelete(prev => [...prev, idx]);
  };

  // Save changes in remove images modal
  const handleSaveRemoveImages = async () => {
    setRemoveImagesStatus('Saving...');
    try {
      const formData = new FormData();
      if (removeImagesToDelete.length > 0) {
        removeImagesToDelete.forEach(idx => formData.append('removeImages', idx));
      }
      const res = await fetch(`${BASE_API_URL}/updateannouncement/${removeImagesAnnouncement._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setRemoveImagesStatus('Images removed!');
        setShowRemoveImages(false);
        setRemoveImagesAnnouncement(null);
        setRemoveImagesPreview([]);
        setRemoveImagesToDelete([]);
        fetchAnnouncements();
      } else {
        setRemoveImagesStatus(data.message || 'Failed to remove images');
      }
    } catch {
      setRemoveImagesStatus('Failed to remove images');
    }
  };

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
                onClick={() => setSelectedMenu("manage-users")}
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
    if (selectedMenu === "manage-users" && isSuperAdmin) {
      return (
        <div style={{ padding: 48, maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24, color: "#1e3c72" }}>Manage Users</h2>
          <form onSubmit={handleUserSearch} style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <input
              type="email"
              placeholder="Enter user email (exact match)"
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              required
              style={{ flex: 1, padding: 10, borderRadius: 6, border: "1.5px solid #e0e0e0", fontSize: 16 }}
            />
            <button type="submit" style={{ padding: "10px 24px", borderRadius: 6, background: "#1e3c72", color: "#fff", border: "none", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Search</button>
          </form>
          {searchStatus && <div style={{ color: "#c00", marginBottom: 16 }}>{searchStatus}</div>}
          {searchedUser && (
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(30,60,114,0.08)", padding: 24, marginBottom: 18 }}>
              <h3 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12, color: "#1e3c72" }}>User Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(searchedUser).map(([key, value]) => (
                  key !== "password" && key !== "__v" && key !== "_id" && (
                    <div key={key} style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontWeight: 600, minWidth: 120, color: "#444" }}>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                      <span style={{ color: "#222" }}>{String(value) || "-"}</span>
                    </div>
                  )
                ))}
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ marginTop: 18, background: "#c0392b", color: "#fff", border: "none", borderRadius: 6, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}
              >
                Delete User
              </button>
            </div>
          )}
          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: 32, minWidth: 320, boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)", textAlign: "center" }}>
                <div style={{ marginBottom: 18, fontWeight: 600, fontSize: "1.2rem", color: "#c0392b" }}>
                  Are you sure you want to delete this user?
                </div>
                <button
                  onClick={handleDeleteUser}
                  style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, cursor: "pointer", marginRight: 12 }}
                  disabled={deleteStatus === "Deleting..."}
                >
                  {deleteStatus === "Deleting..." ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteStatus(""); }}
                  style={{ background: "#eee", color: "#1e3c72", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, cursor: "pointer" }}
                  disabled={deleteStatus === "Deleting..."}
                >
                  Cancel
                </button>
                {deleteStatus && deleteStatus !== "Deleting..." && <div style={{ marginTop: 12, color: deleteStatus.includes("success") ? "#28a745" : "#c0392b" }}>{deleteStatus}</div>}
              </div>
            </div>
          )}
        </div>
      );
    }
    if (selectedMenu === "announcements") {
      // Announcements Section
      return (
        <AnnouncementsSection isSuperAdmin={isSuperAdmin} userEmail={userEmail} />
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
              "manage-users": "Manage Users",
              "manage-teachers": "Manage Teachers",
              "manage-books": "Manage Books",
              "records": "Records",
              "announcements": "Announcements",
              "reports": "Reports",
              "settings": "Settings"
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
        <AdminSidebar
          userEmail={userEmail}
          userPhoto={userPhoto}
          onMenuSelect={setSelectedMenu}
          selectedMenu={selectedMenu}
          isSuperAdmin={isSuperAdmin}
          setShowAddAdmin={setShowAddAdmin}
          setShowRemoveAdmin={setShowRemoveAdmin}
          setShowViewAdmins={setShowViewAdmins}
        />
        <main style={{ marginLeft: 260, flex: 1, minHeight: "100vh", background: "#f4f7fa", transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)" }}>
          {renderContent()}
        </main>
      </div>
      {/* Admin management UI for superadmins */}
      {isSuperAdmin && (
        <>
          {/* Add Admin Modal */}
          {showAddAdmin && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
            }}>
              <div style={{
                background: "#fff", color: "#222", borderRadius: 12, padding: 32, minWidth: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.18)"
              }}>
                <h2 style={{ marginBottom: 18 }}>Add Admin</h2>
                <form onSubmit={handleAddAdmin}>
                  <div style={{ marginBottom: 12 }}>
                    <label>Email:</label><br />
                    <input
                      type="email"
                      required
                      value={adminForm.email}
                      onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}
                      style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
                    />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={adminForm.isSuperAdmin}
                        onChange={e => setAdminForm(f => ({ ...f, isSuperAdmin: e.target.checked }))}
                      />{" "}
                      Is Superadmin
                    </label>
                  </div>
                  <button type="submit" style={{
                    background: "#1e3c72", color: "#fff", border: "none", borderRadius: 6, padding: "8px 24px", fontWeight: 600, cursor: "pointer"
                  }}>
                    Add
                  </button>
                  <button type="button" onClick={() => { setShowAddAdmin(false); setAddStatus(""); }} style={{
                    marginLeft: 12, background: "#bbb", color: "#222", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 600, cursor: "pointer"
                  }}>
                    Cancel
                  </button>
                  <div style={{ marginTop: 10, color: "#1e3c72", fontWeight: 500 }}>{addStatus}</div>
                </form>
              </div>
            </div>
          )}
          {/* Remove Admin Modal */}
          {showRemoveAdmin && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
            }}>
              <div style={{
                background: "#fff", color: "#222", borderRadius: 12, padding: 32, minWidth: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.18)"
              }}>
                <h2 style={{ marginBottom: 18, color: "#c0392b" }}>Remove Admin</h2>
                <form onSubmit={handleRemoveAdmin}>
                  <div style={{ marginBottom: 12 }}>
                    <label>Email:</label><br />
                    <input
                      type="email"
                      required
                      value={removeEmail}
                      onChange={e => setRemoveEmail(e.target.value)}
                      style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #bbb" }}
                    />
                  </div>
                  <button type="submit" style={{
                    background: "#c0392b", color: "#fff", border: "none", borderRadius: 6, padding: "8px 24px", fontWeight: 600, cursor: "pointer"
                  }}>
                    Remove
                  </button>
                  <button type="button" onClick={() => { setShowRemoveAdmin(false); setRemoveStatus(""); }} style={{
                    marginLeft: 12, background: "#bbb", color: "#222", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 600, cursor: "pointer"
                  }}>
                    Cancel
                  </button>
                  <div style={{ marginTop: 10, color: "#c0392b", fontWeight: 500 }}>{removeStatus}</div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
      {/* View Admins Modal - moved outside isSuperAdmin check */}
      {showViewAdmins && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", color: "#222", borderRadius: 12, padding: 32, minWidth: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.18)"
          }}>
            <h2 style={{ marginBottom: 18 }}>Current Admins</h2>
            {/* Show superadmins first, then admins, with emails listed below each */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#ff0080" }}>Superadmins</div>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: 8 }}>
                {admins.filter(a => a.isSuperAdmin).map(a => (
                  <li key={a._id} style={{ marginBottom: 2 }}>
                    {a.email}
                  </li>
                ))}
              </ul>
              <div style={{ fontWeight: 700, margin: "18px 0 8px 0", color: "#1e3c72" }}>Admins</div>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {admins.filter(a => !a.isSuperAdmin).map(a => (
                  <li key={a._id} style={{ marginBottom: 2 }}>
                    {a.email}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setShowViewAdmins(false)} style={{
              marginTop: 18, background: "#bbb", color: "#222", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 600, cursor: "pointer"
            }}>
              Close
            </button>
          </div>
        </div>
      )}
      {/* Remove Images Modal */}
      {showRemoveImages && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: 18 }}>Remove Images</h3>
            {Array.isArray(removeImagesPreview) && removeImagesPreview.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                {removeImagesPreview.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={img} alt="Preview" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6 }} />
                    <button type="button" onClick={() => handleRemoveImageInModal(idx)} style={{ position: 'absolute', top: 2, right: 2, background: '#c0392b', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontWeight: 700, cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginBottom: 18 }}>No images to remove.</div>
            )}
            <div style={{ marginTop: 10, color: '#1e3c72', fontWeight: 500 }}>{removeImagesStatus}</div>
            <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button type="button" onClick={handleSaveRemoveImages} style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
              <button type="button" onClick={() => setShowRemoveImages(false)} style={{ background: '#bbb', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
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
        © {new Date().getFullYear()} VK Admin Portal. All rights reserved. | Demo Footer Info
      </footer>
    </div>
  );
}

export default function AdminDashboardProtected() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}

function AnnouncementsSection({ isSuperAdmin, userEmail }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState(null);
  const [form, setForm] = useState({ text: '', images: [] });
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [removedImages, setRemovedImages] = useState([]);
  const [removingImage, setRemovingImage] = useState({ announcementId: null, imageIndex: null, loading: false });

  // Fetch announcements
  const fetchAnnouncements = useCallback(() => {
    setLoading(true);
    fetch(`${BASE_API_URL}/getannouncements`)
      .then(res => res.json())
      .then(data => {
        setAnnouncements(data.announcements || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Handle image preview
  useEffect(() => {
    if (form.images && form.images.length > 0) {
      const url = URL.createObjectURL(form.images[0]);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview('');
    }
  }, [form.images]);

  // Create announcement
  const handleCreate = async (e) => {
    e.preventDefault();
    setStatus('Creating...');
    try {
      const formData = new FormData();
      formData.append('text', form.text);
      if (form.images && form.images.length > 0) {
        for (let i = 0; i < form.images.length; i++) {
          formData.append('images', form.images[i]);
        }
      }
      formData.append('createdBy', userEmail);
      const res = await fetch(`${BASE_API_URL}/addannouncement`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Announcement created!');
        setForm({ text: '', images: [] });
        setShowCreate(false);
        // Add the new announcement to the state
        setAnnouncements(prev => [data.announcement, ...prev]);
      } else {
        setStatus(data.message || 'Failed to create');
      }
    } catch {
      setStatus('Failed to create');
    }
  };

  // Edit announcement
  const handleEdit = (announcement) => {
    setEditAnnouncement(announcement);
    setForm({ text: announcement.text, images: [] });
    setPreview(Array.isArray(announcement.images) ? [...announcement.images] : []);
    setRemovedImages([]);
    setShowEdit(true);
    setStatus('');
  };

  // Update announcement
  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus('Updating...');
    try {
      const formData = new FormData();
      formData.append('text', form.text);
      if (form.images && form.images.length > 0) {
        for (let i = 0; i < form.images.length; i++) {
          formData.append('images', form.images[i]);
        }
      }
      if (removedImages.length > 0) {
        removedImages.forEach(idx => formData.append('removeImages', idx));
      }
      const res = await fetch(`${BASE_API_URL}/updateannouncement/${editAnnouncement._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Announcement updated!');
        setShowEdit(false);
        setEditAnnouncement(null);
        setForm({ text: '', images: [] });
        // Update the announcement in the state
        setAnnouncements(prev => prev.map(a => a._id === data.announcement._id ? data.announcement : a));
      } else {
        setStatus(data.message || 'Failed to update');
      }
    } catch {
      setStatus('Failed to update');
    }
  };

  // Delete announcement
  const handleDelete = async (id) => {
    setStatus('Deleting...');
    try {
      const res = await fetch(`${BASE_API_URL}/removeannouncement/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Deleted!');
        setDeleteConfirmId(null);
        // Remove the deleted announcement from the state
        setAnnouncements(prev => prev.filter(a => a._id !== data.id));
      } else {
        setStatus('Failed to delete');
      }
    } catch {
      setStatus('Failed to delete');
    }
  };

  // Form change handler
  const handleFormChange = e => {
    const { name, value, files } = e.target;
    if (name === 'images' && files) {
      setForm(f => ({ ...f, images: Array.from(files) }));
      // Show previews for new images
      const filePreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreview(prev => Array.isArray(prev) ? [...prev, ...filePreviews] : filePreviews);
    } else if (name === 'text') {
      setForm(f => ({ ...f, text: value }));
    }
  };

  // Remove image in edit (by index)
  const handleRemoveImage = (idx) => {
    setPreview(prev => Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : []);
    setRemovedImages(prev => [...prev, idx]);
  };

  // Add this function inside AnnouncementsSection:
  const handleRemoveImageClick = (announcementId, imageIndex) => {
    setRemovingImage({ announcementId, imageIndex, loading: false });
  };
  const handleConfirmRemoveImage = async (announcementId, imageIndex) => {
    setRemovingImage({ announcementId, imageIndex, loading: true });
    try {
      const res = await fetch(`${BASE_API_URL}/announcement/${announcementId}/remove-image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ imageIndex })
      });
      setRemovingImage({ announcementId: null, imageIndex: null, loading: false });
      const data = await res.json();
      if (res.ok) {
        // Update the announcement in the state with the returned announcement
        setAnnouncements(prev => prev.map(a => a._id === announcementId ? data.announcement : a));
      } else {
        alert(data.message || 'Failed to remove image');
      }
    } catch {
      setRemovingImage({ announcementId: null, imageIndex: null, loading: false });
      alert('Failed to remove image');
    }
  };
  const handleCancelRemoveImage = () => {
    setRemovingImage({ announcementId: null, imageIndex: null, loading: false });
  };

  return (
    <div style={{ padding: 48, maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 24, color: '#1e3c72' }}>Announcements</h2>
      {isSuperAdmin && (
        <button onClick={() => { setShowCreate(true); setForm({ text: '', images: [] }); setPreview(''); setStatus(''); }}
          style={{ marginBottom: 24, background: '#1e3c72', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
          + Create Announcement
        </button>
      )}
      {loading ? <div>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {announcements.length === 0 && <div>No announcements yet.</div>}
          {announcements.map(a => (
            <div key={a._id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(30,60,114,0.08)', padding: 24, position: 'relative', marginBottom: 8 }}>
              {isSuperAdmin && (
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(a)} style={{ background: '#f7ca18', color: '#222', border: 'none', borderRadius: 4, padding: '4px 12px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => setDeleteConfirmId(a._id)} style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                </div>
              )}
              <div style={{ fontSize: 17, color: '#222', marginBottom: 12, whiteSpace: 'pre-line' }}>{a.text}</div>
              {/* Show all images in the announcement */}
              {a.images && a.images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                  {a.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={img} alt="Announcement" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8, boxShadow: '0 2px 8px rgba(30,60,114,0.10)' }} />
                      {isSuperAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRemoveImageClick(a._id, idx)}
                            style={{ position: 'absolute', top: 2, right: 2, background: '#c0392b', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontWeight: 700, cursor: 'pointer' }}
                            title="Remove image"
                            disabled={removingImage.loading && removingImage.announcementId === a._id && removingImage.imageIndex === idx}
                          >×</button>
                          {removingImage.announcementId === a._id && removingImage.imageIndex === idx && (
                            <div style={{ position: 'absolute', top: 30, right: 0, background: '#fff', border: '1px solid #c0392b', borderRadius: 6, padding: '8px 12px', zIndex: 10, boxShadow: '0 2px 8px rgba(192,57,43,0.10)', minWidth: 160 }}>
                              <div style={{ color: '#c0392b', fontWeight: 600, marginBottom: 8 }}>Remove this image?</div>
                              <button
                                type="button"
                                onClick={() => handleConfirmRemoveImage(a._id, idx)}
                                style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, marginRight: 8, cursor: 'pointer' }}
                                disabled={removingImage.loading}
                              >{removingImage.loading ? 'Removing...' : 'Yes'}</button>
                              <button
                                type="button"
                                onClick={handleCancelRemoveImage}
                                style={{ background: '#eee', color: '#1e3c72', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }}
                                disabled={removingImage.loading}
                              >Cancel</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>By: {a.createdBy} | {new Date(a.createdAt).toLocaleString()}</div>
              {/* Delete confirmation popup below the announcement */}
              {deleteConfirmId === a._id && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 8,
                  background: '#fff', border: '1.5px solid #c0392b', borderRadius: 10, boxShadow: '0 4px 24px rgba(192,57,43,0.10)',
                  padding: 24, zIndex: 10, textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#c0392b', marginBottom: 12 }}>
                    Are you sure you want to delete this announcement?
                  </div>
                  <button
                    onClick={() => handleDelete(a._id)}
                    style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 28px', fontWeight: 600, cursor: 'pointer', marginRight: 12 }}
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    style={{ background: '#eee', color: '#1e3c72', border: 'none', borderRadius: 8, padding: '8px 28px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  {status && <div style={{ marginTop: 10, color: status.includes('Deleted') ? '#28a745' : '#c0392b' }}>{status}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Create Announcement Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: 18 }}>Create Announcement</h3>
            <form onSubmit={handleCreate}>
              <textarea name="text" value={form.text} onChange={handleFormChange} required rows={4} placeholder="Announcement text..." style={{ width: '100%', padding: 10, borderRadius: 6, border: '1.5px solid #e0e0e0', fontSize: 16, marginBottom: 12 }} />
              <input type="file" name="images" accept="image/*" multiple onChange={handleFormChange} style={{ marginBottom: 12 }} />
              {preview && <img src={preview} alt="Preview" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 6, marginBottom: 8 }} />}
              <div style={{ marginTop: 10, color: '#1e3c72', fontWeight: 500 }}>{status}</div>
              <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button type="submit" style={{ background: '#1e3c72', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, cursor: 'pointer' }}>Create</button>
                <button type="button" onClick={() => { setShowCreate(false); setStatus(''); }} style={{ background: '#bbb', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Announcement Modal */}
      {showEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: 18 }}>Edit Announcement</h3>
            <form onSubmit={handleUpdate}>
              <textarea name="text" value={form.text} onChange={handleFormChange} required rows={4} placeholder="Announcement text..." style={{ width: '100%', padding: 10, borderRadius: 6, border: '1.5px solid #e0e0e0', fontSize: 16, marginBottom: 12 }} />
              <input type="file" name="images" accept="image/jpeg,image/png,image/jpg" multiple onChange={handleFormChange} style={{ marginBottom: 12 }} />
              {/* Show all preview images with remove buttons */}
              {Array.isArray(preview) && preview.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                  {preview.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={img} alt="Preview" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6 }} />
                      <button type="button" onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: 2, right: 2, background: '#c0392b', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontWeight: 700, cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 10, color: '#1e3c72', fontWeight: 500 }}>{status}</div>
              <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button type="submit" style={{ background: '#f7ca18', color: '#222', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, cursor: 'pointer' }}>Update</button>
                <button type="button" onClick={() => { setShowEdit(false); setEditAnnouncement(null); setStatus(''); }} style={{ background: '#bbb', color: '#222', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}