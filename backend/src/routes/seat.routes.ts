import { Router } from 'express';
import {
  SeatController,
  assignSeatSchema,
  transferSeatSchema,
} from '../controllers/seat.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Role } from '../types/index.js';

export const seatRouter = Router();

// Protect all seat endpoints with JWT authentication and OWNER role
seatRouter.use(authenticate, requireRole(Role.OWNER));

seatRouter.get('/', SeatController.getAllSeats);
seatRouter.get('/:seatNumber', SeatController.getSeatByNumber);
seatRouter.post('/:seatNumber/assign', validateBody(assignSeatSchema), SeatController.assignSeat);
seatRouter.post('/:seatNumber/vacate', SeatController.vacateSeat);
seatRouter.post('/transfer/:studentId', validateBody(transferSeatSchema), SeatController.transferStudentSeat);
