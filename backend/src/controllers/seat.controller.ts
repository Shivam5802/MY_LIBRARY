import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SeatService } from '../services/seat.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const assignSeatSchema = z.object({
  studentId: z.string().uuid('Invalid student ID format.'),
});

export const transferSeatSchema = z.object({
  newSeatNumber: z.number().int().min(1).max(92, 'Seat number must be between 1 and 92.'),
});

export class SeatController {
  static async getAllSeats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seats = await SeatService.getAllSeats();
      sendSuccess(res, { seats }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getSeatByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seatNumber = parseInt(req.params.seatNumber || '', 10);
      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > 92) {
        sendError(res, 'INVALID_SEAT_NUMBER', 'Seat number must be an integer between 1 and 92.', 400);
        return;
      }

      const seat = await SeatService.getSeatByNumber(seatNumber);
      if (!seat) {
        sendError(res, 'SEAT_NOT_FOUND', `Seat ${seatNumber} not found.`, 404);
        return;
      }

      sendSuccess(res, { seat }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async assignSeat(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const seatNumber = parseInt(req.params.seatNumber || '', 10);
      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > 92) {
        sendError(res, 'INVALID_SEAT_NUMBER', 'Seat number must be an integer between 1 and 92.', 400);
        return;
      }

      const { studentId } = req.body;
      const updatedSeat = await SeatService.assignSeat(seatNumber, studentId);
      sendSuccess(res, { seat: updatedSeat }, 200);
    } catch (error: any) {
      sendError(res, 'SEAT_ASSIGNMENT_ERROR', error.message || 'Failed to assign seat.', 400);
    }
  }

  static async vacateSeat(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const seatNumber = parseInt(req.params.seatNumber || '', 10);
      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > 92) {
        sendError(res, 'INVALID_SEAT_NUMBER', 'Seat number must be an integer between 1 and 92.', 400);
        return;
      }

      const updatedSeat = await SeatService.vacateSeat(seatNumber);
      sendSuccess(res, { seat: updatedSeat }, 200);
    } catch (error: any) {
      sendError(res, 'SEAT_VACATE_ERROR', error.message || 'Failed to vacate seat.', 400);
    }
  }

  static async transferStudentSeat(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const studentId = req.params.studentId || '';
      const { newSeatNumber } = req.body;

      const updatedSeat = await SeatService.transferStudentSeat(studentId, newSeatNumber);
      sendSuccess(res, { seat: updatedSeat }, 200);
    } catch (error: any) {
      sendError(res, 'SEAT_TRANSFER_ERROR', error.message || 'Failed to transfer seat.', 400);
    }
  }
}
