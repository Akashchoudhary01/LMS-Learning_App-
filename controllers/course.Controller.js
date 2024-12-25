import Course from "../models/course.model.js"
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises'

const getAllCourses = async (req , res , next)=>{
    const courses = await Course.find({ }).select('-lectures');

    res.status(200).json({
        success:true,
        message:'All Courses'.
        courses,
    });


}
const getLectureByCoursesId = async (req , res , next)=>{

    try {
        const {id} = req.params;
        const course = await course.findById(id);

        if(!course){
            return next(
                new AppError('invalid course id' , 400)
           )
        }

        res.status(200).json({
            success:true,
            message:'Courses lecture fatched successfully',
            lectures: course.lecture
        });

        
    } catch (e) {
        return next(new AppError(e.message , 400))
        
    }
}
const createCourse =async (req, res , next)=>{
    try {
        const {title , description , category , createdBy} = req.body;

        if(!title || !description || !category || !createdBy){
            return (
                new AppError("every fild is mendetory" , 400)
            );
        }
        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail:{
                public_id: 'dummy',
                secure_url: 'dummy',
            },

        });
        if(!course){
            return (
                new AppError("Course Couldn't created" , 500)
            );
            
        }
        if(req.file){
            const result = await cloudinary.v2.uploader.upload(req.file.path , {
                folder : 'lms'
            });
            if(result){
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }
            fs.rm(`uploads/${req.file.filename}`);
        }
        await course.save();
        res.status(200).json({
            success:true,
            message:'Course Created Successfully',
            course
        })
      
    } catch (err) {
        return (new AppError(err.message , 400))
        
    }
    

}
const updateCourse =async (req, res , next)=>{
try {
    const {id} = req.params;
    const course = await Course.findByIdAndUpdate(
        id,{
            $set:req.body
        },
        {
            runValidators:true
        }
    );
    if(!course){
        return next(new AppError('Course with given id dose not exist', 400))
    }
    res.status(200).json({
        success:true,
        message: 'Course Updated Successfully',
        course
    })
    
} catch (err) {
    return next(new AppError(err.message , 400))
    
}

}
const removeCourse =async (req, res , next)=>{
try {
    const { id} = req.params;
    const course = await Course.findById(id);
    if(!course){
        return next(new AppError('Course Dose Not exist' , 400))
    }
    await Course.findByIdAndDelete(id);
    res.status(200).json({
        success:true,
        message:'Course deleted Successfully'
    })
} catch (err) {
    return next(new AppError(err.message , 400))
    

    
}


}

export{
    getAllCourses,
    getLectureByCoursesId,
    createCourse,
    updateCourse,
    removeCourse
}