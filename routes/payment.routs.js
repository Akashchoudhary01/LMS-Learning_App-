import { Router } from "express";
import { getRazorpayApiKey ,
    bySubscription,
    verifySubscription,
    cancelSubscription,
    allPayments
  } from "../controllers/payment.Controller.js";
import { authirizedRoles, authoriedSubscriber,isLoggedIn } from "../middelware/auth.middleware.js";

const router = Router();

router
     .route("/razorpay-key")
     .get(
        isLoggedIn,
        getRazorpayApiKey
    );
router
     .route('/subscribe')
     .post(
        isLoggedIn,
        bySubscription
    );
router 
      .route('/verify')
      .post(
        isLoggedIn,
        verifySubscription); 
router 
      .route('/unsubscribe')
      .post(isLoggedIn,
        authoriedSubscriber,
        cancelSubscription)        
router 
    .route('/')
    .get(isLoggedIn,
        authirizedRoles('ADMIN'),
        allPayments,
    );  
 
    
export default router  