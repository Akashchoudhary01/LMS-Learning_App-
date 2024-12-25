import {Router } from 'express';
import {
      createCourse,
      getAllCourses,
      getLectureByCoursesId, 
      removeCourse, 
      updateCourse } from '../controllers/course.Controller.js';
import upload from '../middelware/multer.middleware.js'
import { authirizedRoles, isLoggedIn } from '../middelware/auth.middleware.js';
const router = Router();

router.route('/')  
      .get(getAllCourses)
      .post(
            isLoggedIn,
            authirizedRoles('ADMIN'),
            upload.single('thumbnail'),
            createCourse
      );

router.route('/:id') 
      .get(getLectureByCoursesId)
      .delete(
            isLoggedIn,
            authirizedRoles('ADMIN'),
            removeCourse
      )
      .put(
            isLoggedIn,
            authirizedRoles('ADMIN'),
            updateCourse
      )
      

export default router;

