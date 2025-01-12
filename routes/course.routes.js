import {Router } from 'express';
import {
      addLectureToCourseById,
      createCourse,
      getAllCourses,
      getLecturesByCourseId,  
      removeLectureFromCourse, 
      updateCourseById } from '../controllers/course.Controller.js';
import upload from '../middelware/multer.middleware.js'
import { authirizedRoles, authoriedSubscriber , isLoggedIn } from '../middelware/auth.middleware.js';
const router = Router();

// Refactored code
router
  .route('/')
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authirizedRoles('ADMIN'),
    upload.single('thumbnail'),
    createCourse
  )
// router

//   .route('/:courseId/lectures/:lectureId')
//   .delete(isLoggedIn, authirizedRoles('ADMIN'), removeLectureFromCourse);
router
  .route('/:courseId/lectures/:lectureId')
  .delete(isLoggedIn, authirizedRoles('ADMIN'), removeLectureFromCourse);  // Make sure this route matches


router
  .route('/:id')
  .get(isLoggedIn, authoriedSubscriber, getLecturesByCourseId) // Added authorizeSubscribers to check if user is admin or subscribed if not then forbid the access to the lectures
  .post(
    isLoggedIn,
    authirizedRoles('ADMIN'),
    upload.single('lecture'),
    addLectureToCourseById
  )
  .put(isLoggedIn, authirizedRoles('ADMIN'), updateCourseById);

export default router;