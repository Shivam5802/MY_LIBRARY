import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { StudentService } from '../services/student.service.js';
import { Shift, Locker, StudentStatus } from '../types/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  mobile: z
    .string()
    .trim()
    .min(10, 'Mobile number must be at least 10 digits.')
    .max(15, 'Mobile number too long.')
    .regex(/^[0-9+\-\s]+$/, 'Invalid mobile number format.'),
  photoUrl: z.string().nullable().optional(),
  shift: z.enum([Shift.MORNING, Shift.EVENING, Shift.FULL_DAY], {
    errorMap: () => ({ message: 'Shift must be MORNING, EVENING, or FULL_DAY.' }),
  }),
  locker: z.enum([Locker.WITH_LOCKER, Locker.WITHOUT_LOCKER], {
    errorMap: () => ({ message: 'Locker must be WITH_LOCKER or WITHOUT_LOCKER.' }),
  }),
  admissionDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: 'Valid admission date is required.',
  }),
  monthlyFee: z.number().nonnegative('Monthly fee must be a non-negative amount.'),
  seatNumber: z.number().int().min(1).max(92).nullable().optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().trim().min(2).optional(),
  mobile: z
    .string()
    .trim()
    .min(10)
    .max(15)
    .regex(/^[0-9+\-\s]+$/)
    .optional(),
  photoUrl: z.string().nullable().optional(),
  shift: z.enum([Shift.MORNING, Shift.EVENING, Shift.FULL_DAY]).optional(),
  locker: z.enum([Locker.WITH_LOCKER, Locker.WITHOUT_LOCKER]).optional(),
  admissionDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)))
    .optional(),
  monthlyFee: z.number().nonnegative().optional(),
});

export class StudentController {
  static async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const status = req.query.status as StudentStatus | undefined;
      const shift = req.query.shift as Shift | undefined;
      const locker = req.query.locker as Locker | undefined;

      let hasSeat: boolean | undefined = undefined;
      if (req.query.hasSeat === 'true') hasSeat = true;
      if (req.query.hasSeat === 'false') hasSeat = false;

      const students = await StudentService.getStudents({
        search,
        status,
        shift,
        locker,
        hasSeat,
      });

      sendSuccess(res, { students }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.getStudentById(req.params.id || '');
      if (!student) {
        sendError(res, 'STUDENT_NOT_FOUND', 'Student not found.', 404);
        return;
      }
      sendSuccess(res, { student }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createStudent(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.createStudent(req.body);
      sendSuccess(res, { student }, 201);
    } catch (error: any) {
      sendError(res, 'CREATE_STUDENT_ERROR', error.message || 'Failed to create student.', 400);
    }
  }

  static async updateStudent(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.updateStudent(req.params.id || '', req.body);
      sendSuccess(res, { student }, 200);
    } catch (error: any) {
      sendError(res, 'UPDATE_STUDENT_ERROR', error.message || 'Failed to update student.', 400);
    }
  }

  static async archiveStudent(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.archiveStudent(req.params.id || '');
      sendSuccess(res, { student }, 200);
    } catch (error: any) {
      sendError(res, 'ARCHIVE_STUDENT_ERROR', error.message || 'Failed to archive student.', 400);
    }
  }

  static async restoreStudent(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.restoreStudent(req.params.id || '');
      sendSuccess(res, { student }, 200);
    } catch (error: any) {
      sendError(res, 'RESTORE_STUDENT_ERROR', error.message || 'Failed to restore student.', 400);
    }
  }
}
