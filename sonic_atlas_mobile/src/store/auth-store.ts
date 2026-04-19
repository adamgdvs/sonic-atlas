import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  loginWithEmail,
  refreshMobileSession,
  type MobileAuthSession,
} from "@/lib/api";

const AUTH_STORAGE_KEY = "sonic-atlas-mobile-auth";

type AuthStatus = "loading" | "signed_in" | "signed_out";

type PersistedAuthSession = Pick<MobileAuthSession, "accessToken" | "refreshToken" | "user">;

type AuthState = {
  accessToken: string | null;
  errorMessage: string | null;
  hydrate: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  refreshToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  status: AuthStatus;
  user: MobileAuthSession["user"] | null;
};

async function persistSession(session: PersistedAuthSession | null) {
  if (!session) {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  errorMessage: null,
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

      if (!stored) {
        set({ accessToken: null, errorMessage: null, refreshToken: null, status: "signed_out", user: null });
        return;
      }

      const session = JSON.parse(stored) as PersistedAuthSession;
      set({
        accessToken: session.accessToken,
        errorMessage: null,
        refreshToken: session.refreshToken,
        status: "signed_in",
        user: session.user,
      });
    } catch {
      await persistSession(null);
      set({ accessToken: null, errorMessage: null, refreshToken: null, status: "signed_out", user: null });
    }
  },
  refreshSession: async () => {
    const refreshToken = get().refreshToken;

    if (!refreshToken) {
      await get().signOut();
      return false;
    }

    try {
      const session = await refreshMobileSession(refreshToken);
      await persistSession(session);
      set({
        accessToken: session.accessToken,
        errorMessage: null,
        refreshToken: session.refreshToken,
        status: "signed_in",
        user: session.user,
      });
      return true;
    } catch {
      await get().signOut();
      return false;
    }
  },
  refreshToken: null,
  signIn: async (email, password) => {
    set({ errorMessage: null, status: "loading" });

    try {
      const session = await loginWithEmail(email, password);
      await persistSession(session);
      set({
        accessToken: session.accessToken,
        errorMessage: null,
        refreshToken: session.refreshToken,
        status: "signed_in",
        user: session.user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      set({
        accessToken: null,
        errorMessage: message,
        refreshToken: null,
        status: "signed_out",
        user: null,
      });
      throw error;
    }
  },
  signOut: async () => {
    await persistSession(null);
    set({ accessToken: null, errorMessage: null, refreshToken: null, status: "signed_out", user: null });
  },
  status: "loading",
  user: null,
}));
