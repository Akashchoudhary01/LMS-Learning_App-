import {Router } from 'express';
import {
      createCourse,
      getAllCourses,
      getLectureByCoursesId, 
      removeCourse, 
      updateCourse } from '../controllers/course.Controller.js';
import upload from '../middelware/multer.middleware.js'
const router = Router();
router.route('/')  
      .get(getAllCourses)
      .post(
            upload.single('thumbnail'),
            createCourse
      );

router.route('/:id') 
      .get(getLectureByCoursesId)
      .delete(removeCourse)
      .put(updateCourse)
      

export default router;

