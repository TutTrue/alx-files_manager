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
router.get('/users/me', userAuth, UsersController.getMe);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', userAuth, AuthController.getDisconnect);

router.post('/files', userAuth, FilesController.postUpload);
router.get('/files/:id', userAuth, FilesController.getShow);
router.get('/files', userAuth, FilesController.getIndex);
router.put('/files/:id/publish', userAuth, FilesController.putPublish);
router.put('/files/:id/unpublish', userAuth, FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);

export default router;
