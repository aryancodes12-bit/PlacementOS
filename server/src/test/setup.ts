process.env.NODE_ENV =
    "test";

process.env.CLIENT_URL ||=
    "http://localhost:5173";

process.env.APP_TIME_ZONE ||=
    "Asia/Kolkata";

/*
 * Import-safe placeholders only.
 * Tests must never contact real external providers.
 */
process.env.GROQ_API_KEY ||=
    "test-groq-key";

process.env.OPENAI_API_KEY ||=
    "test-openai-key";

process.env.RAZORPAY_KEY_ID ||=
    "rzp_test_placeholder";

process.env.RAZORPAY_KEY_SECRET ||=
    "test-placeholder";

process.env.FIREBASE_PROJECT_ID ||=
    "placementos-test";

process.env.FIREBASE_CLIENT_EMAIL ||=
    "firebase-test@placementos-test.iam.gserviceaccount.com";

process.env.FIREBASE_PRIVATE_KEY ||=
    [
        "-----BEGIN PRIVATE KEY-----",
        "TEST_PRIVATE_KEY",
        "-----END PRIVATE KEY-----",
    ].join("\n");
process.env.JWT_SECRET ||=
    "test-access-secret-abcdefghijklmnopqrstuvwxyz-1234567890";

process.env.JWT_REFRESH_SECRET ||=
    "test-refresh-secret-abcdefghijklmnopqrstuvwxyz-1234567890";