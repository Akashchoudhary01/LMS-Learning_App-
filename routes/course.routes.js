import {Router } from 'express';
import {
      addLectureByCourseID,
      createCourse,
      getAllCourses,
      getLectureByCoursesId, 
      removeCourse, 
      removeLectureFromCourse, 
      updateCourse } from '../controllers/course.Controller.js';
import upload from '../middelware/multer.middleware.js'
import { authirizedRoles, authoriedSubscriber , isLoggedIn } from '../middelware/auth.middleware.js';
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
      .get(isLoggedIn , authoriedSubscriber , getLectureByCoursesId)
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
      .post(
            isLoggedIn,
            authirizedRoles('ADMIN'),
            upload.single('lecture'),
            addLectureByCourseID
      )
      .delete(
            isLoggedIn, 
            authirizedRoles('ADMIN'), 
            removeLectureFromCourse
      );
      

export default router;

