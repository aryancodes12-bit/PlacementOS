import "dotenv/config";
import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing");
}

export const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
});

export const getRazorpayKeyId = () => keyId;

export const getPremiumAmountInPaise = () => {
    const priceInInr = Number(process.env.PREMIUM_PRICE_INR || 199);

    if (Number.isNaN(priceInInr) || priceInInr <= 0) {
        return 19900;
    }

    return Math.round(priceInInr * 100);
};

export const createShortReceipt = () => {
    return `prem_${Date.now().toString().slice(-10)}`;
};

export const verifyRazorpaySignature = ({
    orderId,
    paymentId,
    signature,
}: {
    orderId: string;
    paymentId: string;
    signature: string;
}) => {
    const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    return generatedSignature === signature;
};