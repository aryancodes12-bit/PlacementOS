
import api from "../../services/api";

import type {
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
} from "./notificationPreference.types";

export const notificationPreferenceService = {
    getPreferences: () => {
        return api.get<NotificationPreferenceResponse>(
            "/notification-preferences"
        );
    },

    updatePreferences: (
        preferences:
            NotificationPreferenceUpdate
    ) => {
        return api.patch<NotificationPreferenceResponse>(
            "/notification-preferences",
            preferences
        );
    },
};

