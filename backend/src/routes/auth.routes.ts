import { Router } from 'express';
import { AuthController, loginSchema } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const authRouter = Router();

authRouter.post('/login', validateBody(loginSchema), AuthController.login);
authRouter.post('/logout', authenticate, AuthController.logout);
authRouter.get('/me', authenticate, AuthController.me);
