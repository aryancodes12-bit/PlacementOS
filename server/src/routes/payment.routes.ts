import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
    createPremiumOrder,
    getMySubscription,
    verifyPremiumPayment,
} from "../controllers/payment.controller";

const router = Router();

router.use(protect);

router.get("/me", getMySubscription);
router.post("/create-premium-order", createPremiumOrder);
router.post("/verify", verifyPremiumPayment);

export default router;