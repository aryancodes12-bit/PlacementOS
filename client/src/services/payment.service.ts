import api from "./api";

export const paymentService = {
    getSubscription: () => api.get("/payments/me"),

    createPremiumOrder: () => api.post("/payments/create-premium-order"),

    verifyPayment: (payload: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) => api.post("/payments/verify", payload),
};