import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import crypto from 'crypto';

const cookieOptions = {
    maxAge: 7*24*60*60*1000 , //7 days
    httpOnly:true,
    secure:true
}


/**
 * @REGISTER
 * @ROUTE @POST {{URL}}/api/v1/user/register
 * @ACCESS Public
 */
const register = async(req , res , next) =>{
    try {
        const {fullName , email , Password , role} = req.body;
        if(!fullName || !email || !Password){
            return next (
                new AppError('All Filds Are Required' , 400) );
        }
        const userExists = await User.findOne({email});
        if(userExists){ 
            return next ( new AppError('Email Alredy Exists', 400) );
        }
        const user = await User.create({
            fullName,
            email,
            Password,
            role,
            avatar:{
                public_id:email,
                // secure_url:'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg' 
                secure_url:process.env.CLOUDINARY_URL

            }

        });
        if(!user){
            return next(new AppError('user registeation failed, please try again' , 400))
        }

        // Run only if user sends a file
        
        if(req.file){
            console.log(req.file);
            
            try {
                const result =await cloudinary.v2.uploader.upload(req.file.path , {
                    folder: 'lms',
                    width: 250,
                    hight:250,
                    gravity:'faces',
                    crop:'fill'
                });
                if(result){
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url= result.secure_url;

                    // Remove file from local server
                    fs.rm(`uploads/${req.file.filename}`)
                }

                
            } catch (e) {
                return next(new AppError(e || 'file not uploded please try again' , 500))
                
            }

        }
        

    
        await user.save();
        user.Password = undefined;
    
        const token = await user.generateJWTToken();
    
        res.cookie ('token' , token , cookieOptions)
    
        res.status(201).json({
            success:true,
            message: 'User register Successfully ',
            user,
        });
        
    } catch (e) {
        return next (
            new AppError(e.message , 500) );
    }



};

// Login
const login = async (req, res, next) => {
    try {
        const { email, Password } = req.body;

        if (!email || !Password) {
            return next(new AppError('All fields are required', 400));
        }

        const user = await User.findOne({ email }).select('+Password');

        if (!user) {
            return next(new AppError('Email does not exist', 400));
        }

        const isPasswordValid = await user.comparePassword(Password);

        if (!isPasswordValid) {
            return next(new AppError('Email or Password does not match', 400));
        }

        const token = await user.generateJWTToken();
        user.Password = undefined;

        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

// LOGOUT
const logout =  (req ,res) =>{
    try {
        res.cookie('token' , null , {
            secure:true,
            maxAge: 0,
            httpOnly:true
        });
        res.status(200).json({
            success:true,
            message:'user logged out Successfully'
        })
        
    } catch (e) {
        return next(new AppError(e.message , 500));    
    }

}

// Get Profile
const getProfile = async (req ,res , next) =>{
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        res.status(200).json({
            success:true,
            message:'User Details',
            user
        });
        
    } catch (e) {
        return next(new AppError('Failed To fetch Profile' , 500));   
    }



};

// Forgot Password
const forgotPassword =async (req , res , next)=>{
    const {email} = req.body;

    if(!email){
        return next(new AppError('Email is required' , 400)); 
    }
    const user = await User.findOne({email});
    if(!user){
        return next(new AppError('Email not registred' , 400)); 

    }
    const resetToken = await user.generatePasswordResetToken();
    await user.save();

    const resetPasseordURL =`${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const subject = 'Reset Password'
    const message = `You can reset your password by clicking <a href=${resetPasseordURL} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasseordURL}.\n If you have not requested this, kindly ignore.`;
;

    try {
        await sendEmail(email , subject , message);

        res.status(200).json({
            success:true,
            message:`reset Password Token Has been send to ${email} successfully;`
        })
        
    } catch (err) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;

        await user.save();
        return next(new AppError(err.message , 400));   
    }


}

// resetPassword
const resetPassword = async (req , res , next)=>{
    const {resetToken} = req.params;

    const {Password} = req.body;
    const forgotPassowrdToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry:{$gt: Date.now()}
    });
    if(!user){
        return next(
            new AppError('token is invalid or expired', 400)
        )
    }

    user.Password = Password;
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken= undefined;

    user.save();

    res.status(200).json({
        success: true,
        message: 'Password Changed Successfully'
    }) 

}

// changePassword
const changePassword =async (req , res , next)=>{
    const {oldPassword , newPassword} = req.body;
    const {id} = req.user;

    if(!oldPassword || !newPassword){
        return next(
            new AppError('All Fileds are mandatory' , 400)
        )
    }

    const user = await User.findById(id).select('+Password');

    if(!user){
        return next(
            new AppError('User Dose not exists' , 400)
        )
    }
    const isPasswordValid = await user.comparePassword(oldPassword);

    if(!isPasswordValid){
        return next(
            new AppError('Invalid Old Passsword' , 400)
        )
    }
    user.Password = newPassword;
    await user.save();

    user.Password = undefined;

    res.status(200).json({
        success: true,
        message:'Password Changed Successsfully'
    });

}

// UpdateUser
const updateUser = async(req , res , next)=>{
    const {fullName} = req.body;
    const id = req.user.id;

    const user = await User.findById(id);

    if(!user){
        return next(
            new AppError('User dose not exists' , 400)
        )
    }

    if(req.fullName){
        user.fullName = fullName;
    }
    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        try {
            const result =await cloudinary.v2.uploader.upload(req.file.path , {
                folder: 'lms',
                width: 250,
                hight:250,
                gravity:'faces',
                crop:'fill'
            });
            if(result){
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url= result.secure_url;

                // Remove file from local server
                fs.rm(`uploads/${req.file.filename}`)
            }

            
        } catch (e) {
            return next(new AppError(e || 'file not uploded please try again' , 500))
            
        }

    }
    await user.save();
    res.status(200).json({
        success:true,
        message:'user details Updated Successfully'
    })

}
export {
    register ,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}