// JWT Token management utilities

export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt_token', token);
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt_token');
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt_token');
  }
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getUserData = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

export const setUserData = (userData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_data', JSON.stringify(userData));
  }
};

export const removeUserData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_data');
  }
};

export const logout = () => {
  removeToken();
  removeUserData();
  localStorage.removeItem('userEmail');
  localStorage.removeItem('isSuperAdmin');
  localStorage.removeItem('parentEmail');
  // Add any other user-specific or role-specific keys here
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};