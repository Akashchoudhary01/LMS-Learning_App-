import { appendFile } from "fs";
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
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path , {
                    folder : 'lms'
                });
                if(result){
                    course.thumbnail.public_id = result.public_id;
                    course.thumbnail.secure_url = result.secure_url;
                }
                fs.rm(`uploads/${req.file.filename}`);
                
            } catch (e) {
                return next(
                    new AppError(e.message , 400)
                )
                
            }
           
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
const addLectureByCourseID = async(req , res ,next)=>{
    try {
        const {title , description } = req.body;
        const {id} = req.params;
        if(!title || !description){
            return next(new AppError('Every fild are mendatory'))
        }

        const course = await Course.findById(id);

        if(!course){
            return next (new AppError('Course With given id dose not exist',400))
        }
        const lectureData = {
            title,
            description,
            lecture:{}
        };
        if(req.file){
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path , {
                    folder : 'lms'
                });
                if(result){
                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url;
                }
                fs.rm(`uploads/${req.file.filename}`);
                
            } catch (e) {
                return next(
                    new AppError(e.message , 400)
                )    
            }
        }
        course.lectures.push(lectureData);

        course.numberOfLectures = course.lectures.length;

        await course.save();

        res.status(200).json({
            success:true,
            message:'your lecture successfully Added to course',
            course
        })

        
    } catch (err) {
        return next (new AppError(err.message , 400))
        
    }

}

// Remove lecture
const removeLectureFromCourse = async(req , res , next)=>{
    try {
        const { courseId , lectureId} = req.params;

        if(!courseId || !lectureId){
            return next(new AppError('every fild is required', 400));
        }
        const course = await Course.findById(courseId);

        if(!course){
            return next (new AppError('Invalid Id or Course dose not exists.' , 400))
        }
        // Find the index of the lecture using the lecture id
        const lectureIndex = course.lectures.findIndex((lecture) => lecture._id.toString() === lectureId.toString()=== lectureId.toString());
        // If returned index is -1 then send error as mentioned below
  if (lectureIndex === -1) {
    return next(new AppError('Lecture does not exist.', 404));
  }

  // Delete the lecture from cloudinary
  await cloudinary.v2.uploader.destroy(
    course.lectures[lectureIndex].lecture.public_id,
    {
      resource_type: 'video',
    }
  );

  // Remove the lecture from the array
  course.lectures.splice(lectureIndex, 1);

  // update the number of lectures based on lectres array length
  course.numberOfLectures = course.lectures.length;

  // Save the course object
  await course.save();

  // Return response
  res.status(200).json({
    success: true,
    message: 'Course lecture removed successfully',
  });


        
    } catch (err) {
        return next(new AppError(err.message , 400));
        
    }


}

export{
    getAllCourses,
    getLectureByCoursesId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureByCourseID,
    removeLectureFromCourse
}