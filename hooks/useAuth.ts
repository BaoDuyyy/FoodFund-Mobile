import { useCallback, useEffect, useState } from "react";
import AuthService from "../services/authService";
import type { SignInPayload, SignUpInput, UserInfo } from "../types/api/auth";

// =============================================================================
// TYPES
// =============================================================================

export type AuthState = {
    /** Current user info from SecureStore */
    user: UserInfo | null;
    /** Whether user is currently logged in */
    isLoggedIn: boolean;
    /** Whether auth state is being loaded */
    loading: boolean;
    /** Last error message, if any */
    error: string | null;
};

export type UseAuthReturn = AuthState & {
    /** Login with email and password */
    login: (email: string, password: string) => Promise<SignInPayload>;
    /** Login with Google ID token */
    loginWithGoogle: (idToken: string) => Promise<SignInPayload>;
    /** Sign up new user */
    signup: (input: SignUpInput) => Promise<void>;
    /** Sign out and clear auth state */
    logout: () => Promise<void>;
    /** Refresh user info from SecureStore */
    refreshUser: () => Promise<void>;
    /** Clear any error */
    clearError: () => void;
};

// =============================================================================
// HOOK
// =============================================================================

/**
 * Custom hook for authentication state and actions.
 * Provides user info, login/logout methods, and loading/error states.
 *
 * @example
 * ```tsx
 * function ProfileScreen() {
 *   const { user, isLoggedIn, loading, logout } = useAuth();
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (!isLoggedIn) return <LoginPrompt />;
 *
 *   return (
 *     <View>
 *       <Text>Welcome, {user?.fullName}</Text>
 *       <Button onPress={logout} title="Logout" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // -------------------------------------------------------------------------
    // Load user from SecureStore on mount
    // -------------------------------------------------------------------------
    const refreshUser = useCallback(async () => {
        try {
            const userInfo = await AuthService.getUserInfo();
            setUser(userInfo);
            setIsLoggedIn(!!userInfo.id);
        } catch (err) {
            // If no user info found, that's expected for logged-out state
            setUser(null);
            setIsLoggedIn(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        refreshUser().finally(() => setLoading(false));
    }, [refreshUser]);

    // -------------------------------------------------------------------------
    // Login with email/password
    // -------------------------------------------------------------------------
    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            const payload = await AuthService.login(email, password);
            await refreshUser();
            return payload;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [refreshUser]);

    // -------------------------------------------------------------------------
    // Login with Google
    // -------------------------------------------------------------------------
    const loginWithGoogle = useCallback(async (idToken: string) => {
        setLoading(true);
        setError(null);

        try {
            const payload = await AuthService.loginWithGoogle(idToken);
            await refreshUser();
            return payload;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [refreshUser]);

    // -------------------------------------------------------------------------
    // Sign up
    // -------------------------------------------------------------------------
    const signup = useCallback(async (input: SignUpInput) => {
        setLoading(true);
        setError(null);

        try {
            await AuthService.signup(input);
            // Note: After signup, user typically needs to login separately
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------
    const logout = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await AuthService.signOut();
            setUser(null);
            setIsLoggedIn(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // -------------------------------------------------------------------------
    // Clear error
    // -------------------------------------------------------------------------
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        user,
        isLoggedIn,
        loading,
        error,
        login,
        loginWithGoogle,
        signup,
        logout,
        refreshUser,
        clearError,
    };
}

export default useAuth;
