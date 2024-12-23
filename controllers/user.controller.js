import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";

const cookieOptions = {
    maxAge: 7*24*60*60*1000 , //7 days
    httpOnly:true,
    secure:true
}

const register = async(req , res , next) =>{
    try {
        const {fullName , email , Password} = req.body;
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
            avatar:{
                public_id:email,
                secure_url: 'Cloudnary url hare'
            }
        });
        if(!user){
            return next(new AppError('user registeation failed, please try again' , 400))
        }
        // todo: File Uplode
    
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

const login = async(req , res , next)=>{
    try {
        
        const {email , Password} = req.body;
    
        if(!email || !Password){
            return next(new AppError('All fields are required' , 400));
        }
        const user = await User.findOne({
            email
        }).select('+Password');
    
        if(!user || !user.comparePassword(Password)){
            return next(new AppError('Email Or Password Dose not match' , 400));
        }
        const token = await user.generateJWTToken();
        user.Password = undefined;
    
        res.cookie('token' , token , cookieOptions);
    
        res.status(200).json({
            success:true,
            message:"user loggedin successfully",
            user,
        });
    } catch (e) {
        return next(new AppError(e.message , 500));
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



}

export {
    register ,
    login,
    logout,
    getProfile
}