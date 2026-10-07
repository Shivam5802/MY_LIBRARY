import { Router } from 'express';
import {
  StudentController,
  createStudentSchema,
  updateStudentSchema,
} from '../controllers/student.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Role } from '../types/index.js';

export const studentRouter = Router();

// Protect all student endpoints with JWT authentication and OWNER role
studentRouter.use(authenticate, requireRole(Role.OWNER));

studentRouter.get('/', StudentController.getStudents);
studentRouter.get('/:id', StudentController.getStudentById);
studentRouter.post('/', validateBody(createStudentSchema), StudentController.createStudent);
studentRouter.patch('/:id', validateBody(updateStudentSchema), StudentController.updateStudent);
studentRouter.post('/:id/archive', StudentController.archiveStudent);
studentRouter.post('/:id/restore', StudentController.restoreStudent);
