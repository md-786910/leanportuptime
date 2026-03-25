import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";
import { API_ENDPOINT } from "../api/api";
const REACT_APP_API_URL = API_ENDPOINT;

let _hydrating = false;

export const useAuthStore = create(
  devtools(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: true,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isHydrating: false }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isHydrating: false,
        }),

      hydrate: async () => {
        if (_hydrating) return;
        _hydrating = true;
        try {
          const { data } = await axios.post(
            `${REACT_APP_API_URL || ""}/api/auth/refresh`,
            {},
            { withCredentials: true },
          );
          const { accessToken } = data.data;
          // Fetch user info with the new token
          const userRes = await axios
            .get(`${REACT_APP_API_URL || ""}/api/auth/me`, {
              headers: { Authorization: `Bearer ${accessToken}` },
              withCredentials: true,
            })
            .catch(() => null);

          if (userRes?.data?.data) {
            set({
              user: userRes.data.data,
              accessToken,
              isAuthenticated: true,
              isHydrating: false,
            });
          } else {
            // If /me doesn't exist yet, just store the token
            set({ accessToken, isAuthenticated: true, isHydrating: false });
          }
        } catch {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isHydrating: false,
          });
        }
      },
    }),
    { name: "auth-store" },
  ),
);
