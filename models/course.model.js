import { Schema , model } from "mongoose";

const courseSchema =  new Schema({
    title:{
        type:String,
        required : [true , 'Title is require'],
        minLength : [8 , 'Title must be at least 8 charchter'],
        maxLength : [45 , 'Title must be less then 45 charchter'],
        trim:true,
    },
    description:{
        type:String,
        required : [true , 'description is require'],
        minLength : [8 , 'description must be at least 8 charchter'],
        maxLength : [200 , 'description must be less then 200 charchter'],
        trim:true,
    },

    category:{
        type:String,
        required : [true , 'Category is require'],

    },
    thumbnail:{
        public_id:{
            type:String,
            required :true 
        },
        secure_url:{
            type:String,
            required :true 
        }
    },
    lactures:[
        {
            title:String,
            description:String,
            lecture:{
                public_id:{
                    type:String
                },
                secure_url:{
                    type:String
                }
            }
        }
    ],
    numberOfLectures:{
        type:Number,
        default:0 ,
    },
    createdBy:{
        type:String,
        required :true
    }
} , {
    timeseries:true
})


const Course = model('Course' , courseSchema);
export default Course;
