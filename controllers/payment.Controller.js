import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";
// import razorpay from 'razorpay'
import crypto from "crypto";
import Payment from "../models/payment.model.js";

const getRazorpayApiKey = (req, res, next) => {
  try {
    req.status(200).json({
      success: true,
      message: "Rezorpay Api Key ",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};
const bySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById;

    if (!user) {
      return next(new AppError("Unauthorized Please Login"));
    }
    if (user === "ADMIN") {
      return next(new AppError("Admin Cant purchase a subscription", 400));
    }
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
    });
    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscribe Successsfully",
      subscription_id: subscription,
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

const verifySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("unauthorized , please login"));
    }
    const subscriptionId = user.subscription.id;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id} | ${subscriptionId}`);

    if (generatedSignature !== razorpay_signature) {
      return next(new AppError("Payment not verified , please try again", 500));
    }
    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });

    user.subscription.status = "active";
    await user.save();

    res.stauts(200).json({
      success: true,
      message: "Payment created or verify successfully !",
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};
const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized Please Login"));
    }
    if (user === "ADMIN") {
      return next(new AppError("Admin Cant cancel a subscription", 400));
    }
    const subscriptionId = user.subscription.id;

    const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    user.subscription.status = subscription.status;
    await user.save();
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};
const allPayments = async(req, res, next) => {
    try {
        const {count} = req.query;
        const payment = await razorpay.subscriptions.all({
            count:count || 10 , 

        });
        
    res.stauts(200).json({
        success: true,
        message: " all Payment",
        subscriptions
    
      });

        
        
    } catch (err) {
        return next (new AppError(err.message ,500));
        
    }
};

export {
  getRazorpayApiKey,
  bySubscription,
  verifySubscription,
  cancelSubscription,
  allPayments,
};
