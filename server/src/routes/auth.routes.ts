import {
    Router,
} from "express";

import {
    rateLimit,
} from "express-rate-limit";

import {
    firebaseGoogleAuth,
    getMe,
    login,
    refreshToken,
    register,
    resendVerification,
    verifyEmail,
} from "../controllers/auth.controller";

import {
    protect,
} from "../middlewares/auth.middleware";

const router = Router();

const credentialsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many authentication attempts. Please try again later.",
    },
});

const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many verification requests. Please try again later.",
    },
});

router.post(
    "/register",
    credentialsLimiter,
    register
);

router.post(
    "/login",
    credentialsLimiter,
    login
);

router.post(
    "/firebase/google",
    credentialsLimiter,
    firebaseGoogleAuth
);

router.post(
    "/verify-email",
    verificationLimiter,
    verifyEmail
);

router.post(
    "/resend-verification",
    verificationLimiter,
    resendVerification
);

router.post(
    "/refresh",
    credentialsLimiter,
    refreshToken
);

router.get(
    "/me",
    protect,
    getMe
);

export default router;