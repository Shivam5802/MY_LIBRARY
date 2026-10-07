import { prisma } from '../config/prisma.js';
import { BillingDateUtils } from '../utils/billing-date.js';
import {
  StudentWithSeat,
  Shift,
  Locker,
  StudentStatus,
  SeatStatus,
  SeatAssignmentHistory,
} from '../types/index.js';

export interface CreateStudentInput {
  name: string;
  mobile: string;
  photoUrl?: string | null;
  shift: Shift;
  locker: Locker;
  admissionDate: string;
  monthlyFee: number;
  seatNumber?: number | null;
}

export interface UpdateStudentInput {
  name?: string;
  mobile?: string;
  photoUrl?: string | null;
  shift?: Shift;
  locker?: Locker;
  admissionDate?: string;
  monthlyFee?: number;
}

export interface StudentFilterOptions {
  search?: string;
  status?: StudentStatus;
  shift?: Shift;
  locker?: Locker;
  hasSeat?: boolean;
}

export class StudentService {
  /**
   * Retrieves students with optional filters and search.
   */
  static async getStudents(filters: StudentFilterOptions = {}): Promise<StudentWithSeat[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.shift) {
      where.shift = filters.shift;
    }

    if (filters.locker) {
      where.locker = filters.locker;
    }

    if (filters.search) {
      const q = filters.search.trim();
      const seatNum = parseInt(q, 10);
      const orConditions: any[] = [
        { name: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q, mode: 'insensitive' } },
      ];

      // If user typed a number, also search matching seat number
      if (!isNaN(seatNum) && seatNum >= 1 && seatNum <= 92) {
        orConditions.push({
          assignments: {
            some: {
              isCurrent: true,
              seat: { seatNumber: seatNum },
            },
          },
        });
      }

      where.OR = orConditions;
    }

    if (filters.hasSeat !== undefined) {
      if (filters.hasSeat) {
        where.assignments = { some: { isCurrent: true } };
      } else {
        where.assignments = { none: { isCurrent: true } };
      }
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          orderBy: { assignedAt: 'desc' },
          include: { seat: true },
        },
      },
    });

    return students.map((s) => {
      const currentAssignment = s.assignments.find((a) => a.isCurrent);
      const seatHistory: SeatAssignmentHistory[] = s.assignments.map((a) => ({
        id: a.id,
        seatNumber: a.seat.seatNumber,
        assignedAt: a.assignedAt.toISOString(),
        vacatedAt: a.vacatedAt ? a.vacatedAt.toISOString() : null,
        isCurrent: a.isCurrent,
      }));

      return {
        id: s.id,
        name: s.name,
        mobile: s.mobile,
        photoUrl: s.photoUrl,
        shift: s.shift as Shift,
        locker: s.locker as Locker,
        admissionDate: s.admissionDate.toISOString(),
        monthlyFee: Number(s.monthlyFee),
        status: s.status as StudentStatus,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        archivedAt: s.archivedAt ? s.archivedAt.toISOString() : null,
        currentSeat: currentAssignment
          ? {
              id: currentAssignment.seat.id,
              seatNumber: currentAssignment.seat.seatNumber,
              assignedAt: currentAssignment.assignedAt.toISOString(),
            }
          : null,
        seatHistory,
      };
    });
  }

  /**
   * Retrieves single student profile with full seat assignment history.
   */
  static async getStudentById(id: string): Promise<StudentWithSeat | null> {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: { assignedAt: 'desc' },
          include: { seat: true },
        },
      },
    });

    if (!student) return null;

    const currentAssignment = student.assignments.find((a) => a.isCurrent);
    const seatHistory: SeatAssignmentHistory[] = student.assignments.map((a) => ({
      id: a.id,
      seatNumber: a.seat.seatNumber,
      assignedAt: a.assignedAt.toISOString(),
      vacatedAt: a.vacatedAt ? a.vacatedAt.toISOString() : null,
      isCurrent: a.isCurrent,
    }));

    return {
      id: student.id,
      name: student.name,
      mobile: student.mobile,
      photoUrl: student.photoUrl,
      shift: student.shift as Shift,
      locker: student.locker as Locker,
      admissionDate: student.admissionDate.toISOString(),
      monthlyFee: Number(student.monthlyFee),
      status: student.status as StudentStatus,
      createdAt: student.createdAt.toISOString(),
      updatedAt: student.updatedAt.toISOString(),
      archivedAt: student.archivedAt ? student.archivedAt.toISOString() : null,
      currentSeat: currentAssignment
        ? {
            id: currentAssignment.seat.id,
            seatNumber: currentAssignment.seat.seatNumber,
            assignedAt: currentAssignment.assignedAt.toISOString(),
          }
        : null,
      seatHistory,
    };
  }

  /**
   * Registers a new student and optionally assigns an available seat in a single transaction.
   */
  static async createStudent(input: CreateStudentInput): Promise<StudentWithSeat> {
    return prisma.$transaction(async (tx) => {
      let targetSeat: any = null;

      // 1. If seat is requested, verify it is available
      if (input.seatNumber !== undefined && input.seatNumber !== null) {
        targetSeat = await tx.seat.findUnique({
          where: { seatNumber: input.seatNumber },
          include: { assignments: { where: { isCurrent: true } } },
        });

        if (!targetSeat) {
          throw new Error(`Seat ${input.seatNumber} does not exist.`);
        }

        if (targetSeat.status === SeatStatus.OCCUPIED || targetSeat.assignments.length > 0) {
          throw new Error(`Seat ${input.seatNumber} is already occupied.`);
        }
      }

      // 2. Create Student with permanent unique UUID
      const student = await tx.student.create({
        data: {
          name: input.name,
          mobile: input.mobile,
          photoUrl: input.photoUrl,
          shift: input.shift,
          locker: input.locker,
          admissionDate: new Date(input.admissionDate),
          monthlyFee: input.monthlyFee,
          status: StudentStatus.ACTIVE,
        },
      });

      // 3. Assign seat if specified
      let currentSeatData: any = null;
      if (targetSeat) {
        const now = new Date();
        const assignment = await tx.studentSeatAssignment.create({
          data: {
            studentId: student.id,
            seatId: targetSeat.id,
            assignedAt: now,
            isCurrent: true,
          },
        });

        await tx.seat.update({
          where: { id: targetSeat.id },
          data: { status: SeatStatus.OCCUPIED },
        });

        currentSeatData = {
          id: targetSeat.id,
          seatNumber: targetSeat.seatNumber,
          assignedAt: assignment.assignedAt.toISOString(),
        };
      }

      // 4. Initialize first recurring billing period anchored to admissionDate
      const firstCycleRange = BillingDateUtils.getBillingPeriodRange(student.admissionDate, 0);
      await tx.billingPeriod.create({
        data: {
          studentId: student.id,
          periodStart: firstCycleRange.periodStart,
          periodEnd: firstCycleRange.periodEnd,
          amount: student.monthlyFee,
          status: 'PENDING',
          shiftSnapshot: student.shift,
          lockerSnapshot: student.locker,
        },
      });

      // 5. Activity log
      await tx.activityLog.create({
        data: {
          action: 'STUDENT_CREATED',
          studentId: student.id,
          entityType: 'Student',
          entityId: student.id,
          metadata: JSON.stringify({
            name: student.name,
            shift: student.shift,
            locker: student.locker,
            seatNumber: targetSeat?.seatNumber ?? null,
          }),
        },
      });

      return {
        id: student.id,
        name: student.name,
        mobile: student.mobile,
        photoUrl: student.photoUrl,
        shift: student.shift as Shift,
        locker: student.locker as Locker,
        admissionDate: student.admissionDate.toISOString(),
        monthlyFee: Number(student.monthlyFee),
        status: student.status as StudentStatus,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
        archivedAt: null,
        currentSeat: currentSeatData,
        seatHistory: currentSeatData
          ? [
              {
                id: 'init',
                seatNumber: currentSeatData.seatNumber,
                assignedAt: currentSeatData.assignedAt,
                vacatedAt: null,
                isCurrent: true,
              },
            ]
          : [],
      };
    });
  }

  /**
   * Updates non-seat student information.
   */
  static async updateStudent(id: string, input: UpdateStudentInput): Promise<StudentWithSeat> {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.mobile !== undefined) updateData.mobile = input.mobile;
    if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;
    if (input.shift !== undefined) updateData.shift = input.shift;
    if (input.locker !== undefined) updateData.locker = input.locker;
    if (input.admissionDate !== undefined) updateData.admissionDate = new Date(input.admissionDate);
    if (input.monthlyFee !== undefined) updateData.monthlyFee = input.monthlyFee;

    await prisma.student.update({
      where: { id },
      data: updateData,
    });

    const updated = await this.getStudentById(id);
    if (!updated) throw new Error('Student not found after update.');
    return updated;
  }

  /**
   * Archives a student: marks status ARCHIVED, records archivedAt timestamp,
   * and automatically releases any currently occupied seat.
   */
  static async archiveStudent(id: string): Promise<StudentWithSeat> {
    return prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id },
        include: {
          assignments: { where: { isCurrent: true } },
        },
      });

      if (!student) {
        throw new Error('Student not found.');
      }

      const now = new Date();

      // Release active seat assignment if any
      for (const assignment of student.assignments) {
        await tx.studentSeatAssignment.update({
          where: { id: assignment.id },
          data: {
            isCurrent: false,
            vacatedAt: now,
          },
        });

        await tx.seat.update({
          where: { id: assignment.seatId },
          data: { status: SeatStatus.AVAILABLE },
        });
      }

      // Mark student ARCHIVED
      await tx.student.update({
        where: { id },
        data: {
          status: StudentStatus.ARCHIVED,
          archivedAt: now,
        },
      });

    // 3. Activity logging
    await tx.activityLog.create({
      data: {
        action: 'STUDENT_ARCHIVED',
        studentId: id,
        entityType: 'Student',
        entityId: id,
        metadata: JSON.stringify({ studentName: student.name }),
      },
    });

    const updated = await this.getStudentById(id);
    if (!updated) throw new Error('Student not found.');
    return updated;
  });
}

/**
 * Restores an archived student: sets status ACTIVE and clears archivedAt.
 * Does NOT auto-assign a seat.
 */
static async restoreStudent(id: string): Promise<StudentWithSeat> {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new Error('Student not found.');

  await prisma.student.update({
    where: { id },
    data: {
      status: StudentStatus.ACTIVE,
      archivedAt: null,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'STUDENT_RESTORED',
      studentId: id,
      entityType: 'Student',
      entityId: id,
      metadata: JSON.stringify({ studentName: student.name }),
    },
  });

  const updated = await this.getStudentById(id);
  if (!updated) throw new Error('Student not found.');
  return updated;
  }
}
