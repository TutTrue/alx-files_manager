import { Router } from 'express';
import userAuth from '../middlewares/userAuth';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', userAuth, AuthController.getDisconnect);
router.get('/users/me', userAuth, UsersController.getMe);
router.post('/files', userAuth, FilesController.postUpload);

export default router;
