import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  AuthApi,
  type BackendUser,
  clearSession,
  getAccessToken,
  getStoredUser,
} from "@/lib/api";

export type User = BackendUser;

type SignupOtpInput = {
  name: string;
  email: string;
  phone?: string;
};

type VerifySignupInput = {
  email: string;
  otp: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  requestSignupOtp: (data: SignupOtpInput) => Promise<void>;
  verifySignup: (data: VerifySignupInput) => Promise<User>;
  signup: (data: { name: string; email: string; phone: string; password: string }) => Promise<User>;
  requestPasswordOtp: (email: string) => Promise<void>;
  resetPassword: (data: { email: string; otp: string; password: string }) => Promise<void>;
  refreshProfile: () => Promise<User | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => (getAccessToken() ? getStoredUser() : null));
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getAccessToken()));

  const refreshProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setIsBootstrapping(false);
      return null;
    }

    try {
      const profile = await AuthApi.profile();
      setUser(profile);
      return profile;
    } catch {
      clearSession();
      setUser(null);
      return null;
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await AuthApi.login(email, password);
    setUser(session.user);
    return session.user;
  }, []);

  const requestSignupOtp = useCallback(async (data: SignupOtpInput) => {
    await AuthApi.requestRegistrationOtp({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || undefined,
    });
  }, []);

  const verifySignup = useCallback(async (data: VerifySignupInput) => {
    const session = await AuthApi.verifyRegistration({
      email: data.email.trim().toLowerCase(),
      otp: data.otp.trim(),
      password: data.password,
    });
    setUser(session.user);
    return session.user;
  }, []);

  const signup = useCallback(
    async (_data: { name: string; email: string; phone: string; password: string }) => {
      throw new Error("Signup now requires email OTP verification.");
    },
    []
  );

  const requestPasswordOtp = useCallback(async (email: string) => {
    await AuthApi.requestPasswordOtp(email.trim().toLowerCase());
  }, []);

  const resetPassword = useCallback(async (data: { email: string; otp: string; password: string }) => {
    await AuthApi.resetPassword({
      email: data.email.trim().toLowerCase(),
      otp: data.otp.trim(),
      password: data.password,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthApi.logout();
    } catch {
      // Keep logout quiet for customers even if the server session is already gone.
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isBootstrapping,
      isAuthenticated: Boolean(user),
      login,
      requestSignupOtp,
      verifySignup,
      signup,
      requestPasswordOtp,
      resetPassword,
      refreshProfile,
      logout,
    }),
    [
      user,
      isBootstrapping,
      login,
      requestSignupOtp,
      verifySignup,
      signup,
      requestPasswordOtp,
      resetPassword,
      refreshProfile,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
