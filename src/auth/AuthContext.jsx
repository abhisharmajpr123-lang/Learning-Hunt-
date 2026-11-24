import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const TOKEN_KEY = 'learnhunt-token';
const AuthContext = createContext(null);

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session then lasts until reload.
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);
  // "loading" until /api/auth/me answers, so a refresh never flashes the login screen.
  const [status, setStatus] = useState(() => (readToken() ? 'loading' : 'signed-out'));

  useEffect(() => {
    const stored = readToken();
    if (!stored) {
      setStatus('signed-out');
      return undefined;
    }

    let active = true;
    api
      .me(stored)
      .then(payload => {
        if (!active) return;
        setUser(payload.user);
        setStatus('signed-in');
      })
      .catch(() => {
        // An expired or tampered token must not leave a half-signed-in UI behind.
        if (!active) return;
        writeToken(null);
        setToken(null);
        setUser(null);
        setStatus('signed-out');
      });

    return () => {
      active = false;
    };
  }, []);

  const startSession = useCallback(payload => {
    writeToken(payload.token);
    setToken(payload.token);
    setUser(payload.user);
    setStatus('signed-in');
    return payload.user;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const payload = await api.login({ email, password });
      return startSession(payload);
    },
    [startSession]
  );

  // Signup creates the account but does not issue a token, so sign in right after.
  const signup = useCallback(
    async ({ name, email, password }) => {
      await api.signup({ name, email, password });
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    writeToken(null);
    setToken(null);
    setUser(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo(
    () => ({ user, token, status, login, signup, logout }),
    [user, token, status, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}

export { TOKEN_KEY };
