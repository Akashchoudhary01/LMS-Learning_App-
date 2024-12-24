import { Schema , model } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'

const userSchema = new Schema({
    fullName:{
        type:'String',
        required : [true , 'Name is require'],
        minLength : [5 , 'Name must be at least 5 charchter'],
        maxLength : [25 , 'Name must be less then 25 charchter'],
        lowercase:true,
        trim:true,
    },
    email:{
        type:'String',
        required : [true , 'email is require'],
        lowercase:true,
        trim:true,
        unique:true,
        match:[
        /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:\\[\x00-\x7F]|[^\\"])*")@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/ ,'Please Fill a valid email'
        ],
        

    },
    Password:{
        type:'String',
        required : [true , 'Password is require'],
        minLength : [8 , 'Password must be at least 5 charchter'],
        select:false,
    },
    avatar:{
        public_id:{
            type:'String'
        },
        secure_url:{
            type:'String'
        }
    },
    role:{
        type:'String',
        enum:['USER' , 'ADMIN'],
        default:'USER'
    },
    forgotPasswordToken:String,
    forgotPasswordExpiry:Date,

}, {
    timeseries:true
});

// 
userSchema.pre('save' , async function(next){
    if(!this.isModified('Password')){
        return next();
    }
    this.Password = await bcrypt.hash(this.Password , 10);

})
userSchema.methods = {

    generateJWTToken: async function(){
        return await jwt.sign(
            {
                id: this._id,
                email: this.email,
                subscription: this.subscription,
                role: this.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn:  process.env.JWT_EXPIRY
            }
        );
    },
    // Compare Password
    comparePassword :async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword , this.Password);

    },
    // forgot password
    generatePasswordResetToken:async ()=>{
        const resetToken = crypto.randomBytes(20).toString('hex');
         
        this.forgotPasswordExpiry = 'Date.now( +15*60*1000'; //15 min from now
         this.forgotPasswordToken = crypto
         .createHash('sha256')
         .update(resetToken)
         .digest('hex')

         return resetToken;

    }
};


const User = model ('User' , userSchema);

export default User;