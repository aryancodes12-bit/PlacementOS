import { Response } from "express";
import { prisma } from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
    createShortReceipt,
    getPremiumAmountInPaise,
    getRazorpayKeyId,
    razorpay,
    verifyRazorpaySignature,
} from "../services/payment.service";
export const createPremiumOrder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const amount = getPremiumAmountInPaise();

        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: createShortReceipt(),
            notes: {
                userId,
                plan: "PREMIUM",
                product: "PlacementOS",
            },
        });

        await prisma.payment.create({
            data: {
                userId,
                amount,
                currency: "INR",
                plan: "PREMIUM",
                status: "CREATED",
                razorpayOrderId: order.id,
            },
        });

        return res.status(201).json({
            keyId: getRazorpayKeyId(),
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            plan: "PREMIUM",
        });
    } catch (error: any) {
        console.error("createPremiumOrder error:", {
            message: error.message,
            description: error.error?.description,
            code: error.error?.code,
            field: error.error?.field,
            statusCode: error.statusCode,
        });

        return res.status(500).json({
            message:
                error.error?.description ||
                error.message ||
                "Failed to create payment order",
            code: error.error?.code,
            field: error.error?.field,
        });
    }
};

export const verifyPremiumPayment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                message: "Missing Razorpay payment verification fields",
            });
        }

        const paymentRecord = await prisma.payment.findFirst({
            where: {
                userId,
                razorpayOrderId: razorpay_order_id,
            },
        });

        if (!paymentRecord) {
            return res.status(404).json({
                message: "Payment order not found",
            });
        }

        if (paymentRecord.status === "PAID") {
            return res.status(200).json({
                message: "Payment already verified",
                plan: "PREMIUM",
            });
        }

        const isValidSignature = verifyRazorpaySignature({
            orderId: paymentRecord.razorpayOrderId,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        });

        if (!isValidSignature) {
            await prisma.payment.update({
                where: {
                    id: paymentRecord.id,
                },
                data: {
                    status: "FAILED",
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                },
            });

            return res.status(400).json({
                message: "Invalid payment signature",
            });
        }

        await prisma.$transaction([
            prisma.payment.update({
                where: {
                    id: paymentRecord.id,
                },
                data: {
                    status: "PAID",
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                },
            }),

            prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    plan: "PREMIUM",
                },
            }),
        ]);

        return res.status(200).json({
            message: "Payment verified successfully",
            plan: "PREMIUM",
        });
    } catch (error: any) {
        console.error("verifyPremiumPayment error:", error);

        return res.status(500).json({
            message: error.message || "Failed to verify payment",
        });
    }
};

export const getMySubscription = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                plan: true,
            },
        });

        const latestPayment = await prisma.payment.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            plan: user?.plan ?? "FREE",
            latestPayment,
        });
    } catch (error: any) {
        console.error("getMySubscription error:", error);

        return res.status(500).json({
            message: error.message || "Failed to fetch subscription",
        });
    }
};