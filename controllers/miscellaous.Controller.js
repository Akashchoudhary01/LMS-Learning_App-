import asyncHandler from "../middelware/asyncHandler.js";
import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * @CONTACT_US
 * @ROUTE @POST {{URL}}/api/v1/contact
 * @ACCESS Public
 */
export const contactUs = asyncHandler(async (req, res, next) => {
  // Destructuring the required data from req.body
  const { name, email, message } = req.body;

  // check all fild are required
  if (!name || !email || !message) {
    return next(new AppError("All filds Are required", 400));
  }

    try {
      const subject = "Contact Us Form";
      const textMessage = `${name} - ${email} <br /> ${message}`;

      // Await the send email
      await sendEmail(process.env.CONTACT_US_EMAIL, subject, textMessage);
    } catch (err) {
      return next(new AppError(err.message, 400));
    }
    res.status(200).json({
        success: true,
        message: 'Your request has been submitted successfully',
      });
    
});

  /**
 * @USER_STATS_ADMIN
 * @ROUTE @GET {{URL}}/api/v1/admin/stats/users
 * @ACCESS Private(ADMIN ONLY)
 */

export const userStats = asyncHandler(async(req , res , next) =>{
    const allUserCount = await User.countDocuments();

    const subscribedUsersCount = await User.countDocuments({
        'subscription.status': 'active', //// subscription.status means we are going inside an object and we have to put this in quotes

    });
    res.status(200).json({
        success: true,
        message: 'All registered users count',
        allUserCount,
        subscribedUsersCount,
      });

})
