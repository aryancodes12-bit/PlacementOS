import "dotenv/config";
import axios from "axios";

const requiredVariables = [
    "EMAILJS_SERVICE_ID",
    "EMAILJS_TEMPLATE_ID",
    "EMAILJS_PUBLIC_KEY",
];

const missingVariables = requiredVariables.filter(
    (key) => !process.env[key]?.trim()
);

if (missingVariables.length > 0) {
    console.error(
        `Missing environment variables: ${missingVariables.join(", ")}`
    );

    process.exit(1);
}

const recipient = process.env.TEST_EMAIL?.trim();

if (!recipient) {
    console.error(
        "Set TEST_EMAIL before running this script."
    );

    process.exit(1);
}

const payload = {
    service_id:
        process.env.EMAILJS_SERVICE_ID.trim(),

    template_id:
        process.env.EMAILJS_TEMPLATE_ID.trim(),

    user_id:
        process.env.EMAILJS_PUBLIC_KEY.trim(),

    template_params: {
        application_name: "PlacementOS",
        to_name: "Aryan Jaiswal",
        to_email: recipient,
        verification_link:
            "http://localhost:5173/verify-email?token=test-token",
        expires_in: "30 minutes",
    },
};

const privateKey =
    process.env.EMAILJS_PRIVATE_KEY?.trim();

if (privateKey) {
    payload.accessToken = privateKey;
}

try {
    const response = await axios.post(
        "https://api.emailjs.com/api/v1.0/email/send",
        payload,
        {
            headers: {
                "Content-Type": "application/json",
            },
            timeout: 10_000,
        }
    );

    console.log(
        "EmailJS success:",
        response.status,
        response.data
    );
} catch (error) {
    console.error("EmailJS failed:", {
        status: error.response?.status,
        response: error.response?.data,
        message: error.message,
    });

    process.exit(1);
}