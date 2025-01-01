import {Router} from 'express';
import{
    contactUs
} from '../controllers/miscellaous.Controller.js'
import {isLoggedIn,
    authirizedRoles} from '../middelware/auth.middleware.js';

  const router = Router();
  
// {{URL}}/api/v1/
router.route('/contact').post(contactUs);
router
  .route('/admin/stats/users')
  .get(isLoggedIn, authirizedRoles('ADMIN'), userStats);

export default router;