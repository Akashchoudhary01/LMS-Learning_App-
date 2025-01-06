import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";
// import razorpay from 'razorpay'
import asyncHandler from '../middelware/asyncHandler.js';
import crypto from "crypto";
import Payment from "../models/payment.model.js";


/**
 * @GET_RAZORPAY_ID
 * @ROUTE @GET {{URL}}/api/v1/payments
 * @ACCESS Private (ADMIN only)
 */
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
// console.log("Razorpay Secret:", process.env.RAZORPAY_SECRET);
// console.log("Razorpay Plan ID:", process.env.RAZORPAY_PLAN_ID);



const getRazorpayApiKey = (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Rezorpay Api Key ",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return next(new AppError(err.message, 500));
  }
};

/**
 * @ACTIVATE_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/subscribe
 * @ACCESS Private (Logged in user only)
 */
export const buySubscription = asyncHandler(async (req, res, next) => {
  // Extracting ID from request obj
  try {
    const { id } = req.user;

    // Finding the user based on the ID
    const user = await User.findById(id);
  
    if (!user) {
      return next(new AppError('Unauthorized, please login'));
    }
  
    // Checking the user role
    if (user.role === 'ADMIN') {
      return next(new AppError('Admin cannot purchase a subscription', 400));
    }
  
    // Creating a subscription using razorpay that we imported from the server
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID, // The unique plan ID
      customer_notify: 1, // Razorpay will notify the customer
      total_count: 12, // Charge every month for a year
    });
    console.log("Subscription created:", subscription);
    
  
    // Adding the ID and the status to the user account
    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;
  
    // Saving the user object
    await user.save();
  
    res.status(200).json({
      success: true,
      message: 'subscribed successfully',
      subscription_id: subscription.id,
    });
    
  } catch (err) {
    return next(new AppError(err.message , 404))
    
  }
 
});
/**
 * @VERIFY_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/verify
 * @ACCESS Private (Logged in user only)
 */


const verifySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

     // Finding the user
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("unauthorized , please login"));
    }

    // Getting the subscription ID from the user object
    const subscriptionId = user.subscription.id;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id} | ${subscriptionId}`)
      .digest('hex');

      // Check if generated signature and signature received from the frontend is the same or not
    if (generatedSignature !== razorpay_signature) {
      return next(new AppError("Payment not verified , please try again", 500));
    }
    
  // If they match create payment and store it in the DB
    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });

      // Update the user subscription status to active (This will be created before this) and save the user
  
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

/**
 * @CANCEL_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/unsubscribe
 * @ACCESS Private (Logged in user only)
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;

    // Finding the user
    const user = await User.findById(id);
  
    // Checking the user role
    if (user.role === 'ADMIN') {
      return next(
        new AppError('Admin does not need to cannot cancel subscription', 400)
      );
    }
  
    // Finding subscription ID from subscription
    const subscriptionId = user.subscription.id;
  
    // Creating a subscription using razorpay that we imported from the server
    try {
      const subscription = await razorpay.subscriptions.cancel(
        subscriptionId // subscription id
      );
  
      // Adding the subscription status to the user account
      user.subscription.status = subscription.status;
  
      // Saving the user object
      await user.save();
    } catch (error) {
      // Returning error if any, and this error is from razorpay so we have statusCode and message built in
      return next(new AppError(error.error.description, error.statusCode));
    }
  
    // Finding the payment using the subscription ID
    const payment = await Payment.findOne({
      razorpay_subscription_id: subscriptionId,
    });
  
    // Getting the time from the date of successful payment (in milliseconds)
    const timeSinceSubscribed = Date.now() - payment.createdAt;
  
    // refund period which in our case is 14 days
    const refundPeriod = 14 * 24 * 60 * 60 * 1000;
  
    // Check if refund period has expired or not
    if (refundPeriod <= timeSinceSubscribed) {
      return next(
        new AppError(
          'Refund period is over, so there will not be any refunds provided.',
          400
        )
      );
    }
  
    // If refund period is valid then refund the full amount that the user has paid
    await razorpay.payments.refund(payment.razorpay_payment_id, {
      speed: 'optimum', // This is required
    });
  
    user.subscription.id = undefined; // Remove the subscription ID from user DB
    user.subscription.status = undefined; // Change the subscription Status in user DB
  
    await user.save();
    await payment.remove();
  
    // Send the response
    res.status(200).json({
      success: true,
      message: 'Subscription canceled successfully',
    });
        
        
    } catch (err) {
        return next (new AppError(err.message ,500));
        
    }
};
/**
 * @GET_RAZORPAY_ID
 * @ROUTE @GET {{URL}}/api/v1/payments
 * @ACCESS Private (ADMIN only)
 */
const allPayments = async (req, res, _next) => {
  const { count, skip } = req.query;

  // Find all subscriptions from razorpay
  const allPayments = await razorpay.subscriptions.all({
    count: count ? count : 10, // If count is sent then use that else default to 10
    skip: skip ? skip : 0, // // If skip is sent then use that else default to 0
  });

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const finalMonths = {
    January: 0,
    February: 0,
    March: 0,
    April: 0,
    May: 0,
    June: 0,
    July: 0,
    August: 0,
    September: 0,
    October: 0,
    November: 0,
    December: 0,
  };

  const monthlyWisePayments = allPayments.items.map((payment) => {
    // We are using payment.start_at which is in unix time, so we are converting it to Human readable format using Date()
    const monthsInNumbers = new Date(payment.start_at * 1000);

    return monthNames[monthsInNumbers.getMonth()];
  });

  monthlyWisePayments.map((month) => {
    Object.keys(finalMonths).forEach((objMonth) => {
      if (month === objMonth) {
        finalMonths[month] += 1;
      }
    });
  });

  const monthlySalesRecord = [];

  Object.keys(finalMonths).forEach((monthName) => {
    monthlySalesRecord.push(finalMonths[monthName]);
  });

  res.status(200).json({
    success: true,
    message: 'All payments',
    allPayments,
    finalMonths,
    monthlySalesRecord,
  });
};

export {
  getRazorpayApiKey,
  // bySubscription,
  verifySubscription,
  cancelSubscription,
  allPayments,
};
