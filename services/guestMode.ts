import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_MODE_KEY = "guestMode";

/**
 * Simple guest mode manager
 * Stores a flag to indicate if user is using app as guest
 */
export const GuestMode = {
    /**
     * Set guest mode (user skipped login)
     */
    async setGuestMode(isGuest: boolean): Promise<void> {
        await AsyncStorage.setItem(GUEST_MODE_KEY, isGuest ? "true" : "false");
    },

    /**
     * Check if user is in guest mode
     */
    async isGuest(): Promise<boolean> {
        const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
        return value === "true";
    },

    /**
     * Clear guest mode (when user logs in)
     */
    async clear(): Promise<void> {
        await AsyncStorage.removeItem(GUEST_MODE_KEY);
    },
};

export default GuestMode;
