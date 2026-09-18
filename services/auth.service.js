import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

const TOKEN_KEY = 'desire_token';
const USER_KEY = 'desire_user';

const isBrowser = () => typeof window !== 'undefined';

const saveSession = ({ token, user }) => {
  if (!isBrowser()) return;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

const clearSession = () => {
  if (!isBrowser()) return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const getStoredToken = () => {
  if (!isBrowser()) return null;

  return localStorage.getItem(TOKEN_KEY);
};

const getStoredUser = () => {
  if (!isBrowser()) return null;

  const user = localStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const login = async (credentials) => {
  const data = await apiFetch(
    ENDPOINTS.AUTH.LOGIN,
    {
      method: 'POST',
      body: JSON.stringify(credentials),
    },
  );

  const token =
    data.token ||
    data.accessToken ||
    data.access_token;

  if (!token) {
    throw new Error(
      'Authentication token was not returned by the server.',
    );
  }

  saveSession({
    token,
    user: data.user,
  });

  return data;
};

const register = async (payload) => {
  const data = await apiFetch(
    ENDPOINTS.AUTH.REGISTER,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  const token =
    data.token ||
    data.accessToken ||
    data.access_token;

  if (token) {
    saveSession({
      token,
      user: data.user,
    });
  }

  return data;
};

const getProfile = async () => {
  const data = await apiFetch(
    ENDPOINTS.AUTH.PROFILE,
  );

  const user = data.user || data;

  if (isBrowser()) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user),
    );
  }

  return user;
};

const logout = () => {
  clearSession();
};

const checkAdmin = async () => {
  return apiFetch(
    ENDPOINTS.AUTH.ADMIN_CHECK,
  );
};

const isAuthenticated = () =>
  Boolean(getStoredToken());

export default {
  login,
  register,
  logout,
  getProfile,
  checkAdmin,
  saveSession,
  clearSession,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
};