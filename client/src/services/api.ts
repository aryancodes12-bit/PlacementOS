import axios from "axios";

const normalizeApiBaseUrl = (
    value?: string
): string => {
    const serverUrl =
        (
            value ||
            "http://localhost:5000"
        )
            .trim()
            .replace(
                /\/+$/,
                ""
            )
            .replace(
                /\/api\/?$/,
                ""
            );

    return `${serverUrl}/api`;
};

const api = axios.create({
    baseURL:
        normalizeApiBaseUrl(
            import.meta.env
                .VITE_API_URL
        ),

    withCredentials:
        true,
});

api.interceptors.request.use(
    (
        config
    ) => {
        const token =
            localStorage.getItem(
                "accessToken"
            );

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    }
);

api.interceptors.response.use(
    (
        response
    ) => response,

    (
        error
    ) => {
        if (
            error.response
                ?.status ===
            401
        ) {
            console.error(
                "Unauthorized request:",
                error.response.data
            );
        }

        return Promise.reject(
            error
        );
    }
);

export default api;