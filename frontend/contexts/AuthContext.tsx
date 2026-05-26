import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { UserData, AuthState } from '../types';
import { authService } from '../utils/apiServices';
import { toast } from 'sonner';

export const GUEST_DATA: UserData = {
  name: 'Tamu',
  email: '',
  hasSeenTutorial: true, 
  themeColor: 'green',
  language: 'id',
};

type AuthContextType = {
  authState: AuthState;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  signUp: (userData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (newData: Partial<UserData> | FormData) => Promise<void>;
  adminLogin: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: normalize backend user to frontend UserData
function normalizeUser(user: any): UserData {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    creator_status: user.creator_status,
    profile_picture: user.profile_picture,
    // Map backend fields to frontend convenience fields
    username: user.name,
    profilePicture: user.profile_picture,
    themeColor: user.themeColor || 'green',
    language: user.language || 'id',
    fullName: user.fullName || user.name,
    phoneNumber: user.phoneNumber || '',
    address: user.address || '',
    gender: user.gender || '',
    age: user.age || '',
    hasSeenTutorial: user.hasSeenTutorial !== undefined ? user.hasSeenTutorial : true,
    // Payment info
    bank_name: user.bank_name || '',
    bank_account_number: user.bank_account_number || '',
    bank_account_holder: user.bank_account_holder || '',
    qris_image: user.qris_image || '',
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userType: null,
    userData: GUEST_DATA,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Proactive session expiry: logout if 24h has passed since login
  const SESSION_MAX_MS = 24 * 60 * 60 * 1000; // 24 jam

  const performSessionLogout = (message: string) => {
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    setAuthState({
      isAuthenticated: false,
      userType: null,
      userData: GUEST_DATA,
    });
    toast.info(message);
  };

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Check if session has expired before even calling API
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime && Date.now() - parseInt(loginTime, 10) > SESSION_MAX_MS) {
          performSessionLogout('Sesi Anda telah berakhir. Silakan login kembali.');
          setIsLoading(false);
          return;
        }

        try {
          const res = await authService.getProfile();
          const user = normalizeUser(res.data);
          setAuthState({
            isAuthenticated: true,
            userType: res.data.role || 'user',
            userData: user,
          });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('loginTime');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Cross-tab sync: detect logout from another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue === null) {
        // Token was removed in another tab — sync logout here
        setAuthState({
          isAuthenticated: false,
          userType: null,
          userData: GUEST_DATA,
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Proactive timer: check every 60s if session has expired
  useEffect(() => {
    const interval = setInterval(() => {
      const loginTime = localStorage.getItem('loginTime');
      const token = localStorage.getItem('token');
      if (token && loginTime && Date.now() - parseInt(loginTime, 10) > SESSION_MAX_MS) {
        performSessionLogout('Sesi Anda telah berakhir. Silakan login kembali.');
      }
    }, 60 * 1000); // Cek setiap 1 menit

    return () => clearInterval(interval);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const res = await authService.login(credentials);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('loginTime', Date.now().toString());
      const normalized = normalizeUser(user);
      setAuthState({
        isAuthenticated: true,
        userType: user.role || 'user',
        userData: { ...normalized, hasSeenTutorial: true },
      });
      toast.success(`Selamat datang kembali, ${user.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.';
      toast.error(message);
      throw error;
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      const res = await authService.googleLogin(idToken);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('loginTime', Date.now().toString());
      const normalized = normalizeUser(user);
      setAuthState({
        isAuthenticated: true,
        userType: user.role || 'user',
        userData: { ...normalized, hasSeenTutorial: true },
      });
      toast.success(`Selamat datang, ${user.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login Google gagal.';
      toast.error(message);
      throw error;
    }
  };

  const adminLogin = async (credentials: { email: string; password: string }) => {
    try {
      const res = await authService.login(credentials);
      const { token, user } = res.data;
      
      if (user.role !== 'admin') {
        throw new Error('Akses ditolak: Akun ini bukan administrator.');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('loginTime', Date.now().toString());
      const normalized = normalizeUser(user);
      setAuthState({
        isAuthenticated: true,
        userType: 'admin',
        userData: { ...normalized, hasSeenTutorial: true },
      });
      toast.success(`Portal Admin diakses: ${user.name}`);
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Login admin gagal.';
      toast.error(message);
      throw error;
    }
  };

  const signUp = async (userData: { name: string; email: string; password: string }) => {
    try {
      const res = await authService.register(userData);
      // Backend register returns user but no token, so we login after register
      toast.success('Pendaftaran berhasil! Silakan login.');
      // Auto-login after registration
      const loginRes = await authService.login({ email: userData.email, password: userData.password });
      const { token, user } = loginRes.data;
      localStorage.setItem('token', token);
      localStorage.setItem('loginTime', Date.now().toString());
      const normalized = normalizeUser(user);
      setAuthState({
        isAuthenticated: true,
        userType: 'user',
        userData: { ...normalized, hasSeenTutorial: false },
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    setAuthState({
      isAuthenticated: false,
      userType: null,
      userData: GUEST_DATA,
    });
    toast.info('Anda telah keluar.');
  };

  const updateUser = async (newData: Partial<UserData> | FormData) => {
    // Optimistic update for plain objects (like themeColor, language)
    const isPlainObject = !(newData instanceof FormData);
    if (isPlainObject) {
      setAuthState(prev => ({
        ...prev,
        userData: prev.userData ? { ...prev.userData, ...newData } : null,
      }));
    }

    try {
      const res = await authService.updateProfile(newData);
      const updatedUser = res.data.user || res.data;
      
      // Update with actual data from server
      setAuthState(prev => ({
        ...prev,
        userData: prev.userData ? { ...prev.userData, ...normalizeUser(updatedUser) } : null,
      }));
      
      toast.success('Berhasil diperbarui.');
    } catch (error: any) {
      toast.error('Gagal memperbarui profil.');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, googleLogin, logout, updateUser, signUp, adminLogin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
