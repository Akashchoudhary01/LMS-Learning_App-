import {Router} from 'express';
import { getProfile, login, logout, register , forgotPassword , resetPassword, changePassword, updateUser } from '../controllers/user.controller.js';
import { isLoggedIn } from '../middelware/auth.middleware.js';
import upload from '../middelware/multer.middleware.js';

const router = Router();

router.post('/register' , upload.single("avatar"), register);
router.post('/login' , login);
router.get('/logout' , logout);
router.get('/me' , isLoggedIn, getProfile);
router.post('/reset' , forgotPassword);
router.post('/reset/:resetToken' , resetPassword);
router.post('/change-passsword' , isLoggedIn , changePassword)
router.put('/update' , isLoggedIn ,upload.single("avatar") , updateUser )


export default router;