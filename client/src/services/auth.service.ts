import api from "./api";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
    emailVerified: boolean;
}

export interface AuthSuccessResponse {
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    email: string;
}

export interface VerificationResponse {
    success: boolean;
    message: string;
    email?: string;
}

export const authService = {
    login: (
        email: string,
        password: string
    ) =>
        api.post<AuthSuccessResponse>(
            "/auth/login",
            {
                email,
                password,
            }
        ),

    register: (
        input: RegisterInput
    ) =>
        api.post<RegisterResponse>(
            "/auth/register",
            input
        ),

    verifyEmail: (
        token: string
    ) =>
        api.post<VerificationResponse>(
            "/auth/verify-email",
            {
                token,
            }
        ),

    resendVerification: (
        email: string
    ) =>
        api.post<VerificationResponse>(
            "/auth/resend-verification",
            {
                email,
            }
        ),

    googleAuthentication: (
        idToken: string
    ) =>
        api.post<AuthSuccessResponse>(
            "/auth/firebase/google",
            {
                idToken,
            }
        ),
};

export const getAuthError = (
    error: any,
    fallback: string
): string => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
};