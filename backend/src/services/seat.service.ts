import { prisma } from '../config/prisma.js';
import { SeatStatus, SeatWithStudent, Shift, Locker } from '../types/index.js';

export class SeatService {
  /**
   * Retrieves all 92 seats ordered by seatNumber, including current student details if occupied.
   */
  static async getAllSeats(): Promise<SeatWithStudent[]> {
    const seats = await prisma.seat.findMany({
      orderBy: { seatNumber: 'asc' },
      include: {
        assignments: {
          where: { isCurrent: true },
          include: {
            student: true,
          },
        },
      },
    });

    return seats.map((seat) => {
      const currentAssignment = seat.assignments[0];
      const student = currentAssignment?.student;

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        status: seat.status as SeatStatus,
        currentStudent: student
          ? {
              id: student.id,
              name: student.name,
              mobile: student.mobile,
              photoUrl: student.photoUrl,
              shift: student.shift as Shift,
              locker: student.locker as Locker,
              admissionDate: student.admissionDate.toISOString(),
              feeCycleStartDate: student.feeCycleStartDate.toISOString(),
              monthlyFee: Number(student.monthlyFee),
              assignedAt: currentAssignment.assignedAt.toISOString(),
            }
          : null,
      };
    });
  }

  /**
   * Retrieves a single seat by seat number.
   */
  static async getSeatByNumber(seatNumber: number): Promise<SeatWithStudent | null> {
    const seat = await prisma.seat.findUnique({
      where: { seatNumber },
      include: {
        assignments: {
          where: { isCurrent: true },
          include: {
            student: true,
          },
        },
      },
    });

    if (!seat) return null;

    const currentAssignment = seat.assignments[0];
    const student = currentAssignment?.student;

    return {
      id: seat.id,
      seatNumber: seat.seatNumber,
      status: seat.status as SeatStatus,
      currentStudent: student
        ? {
            id: student.id,
            name: student.name,
            mobile: student.mobile,
            photoUrl: student.photoUrl,
            shift: student.shift as Shift,
            locker: student.locker as Locker,
            admissionDate: student.admissionDate.toISOString(),
            feeCycleStartDate: student.feeCycleStartDate.toISOString(),
            monthlyFee: Number(student.monthlyFee),
            assignedAt: currentAssignment.assignedAt.toISOString(),
          }
        : null,
    };
  }

  /**
   * Assigns an active student to an available seat.
   */
  static async assignSeat(seatNumber: number, studentId: string): Promise<SeatWithStudent> {
    return prisma.$transaction(async (tx) => {
      // 1. Verify seat exists and is currently AVAILABLE
      const seat = await tx.seat.findUnique({
        where: { seatNumber },
        include: {
          assignments: { where: { isCurrent: true } },
        },
      });

      if (!seat) {
        throw new Error(`Seat ${seatNumber} does not exist.`);
      }

      if (seat.status === SeatStatus.OCCUPIED || seat.assignments.length > 0) {
        throw new Error(`Seat ${seatNumber} is already occupied.`);
      }

      // 2. Verify student exists and is ACTIVE
      const student = await tx.student.findUnique({
        where: { id: studentId },
        include: {
          assignments: { where: { isCurrent: true }, include: { seat: true } },
        },
      });

      if (!student) {
        throw new Error('Student not found.');
      }

      if (student.status !== 'ACTIVE') {
        throw new Error('Cannot assign seat to an archived or inactive student.');
      }

      // 3. If student already has a current seat assignment, vacate old seat first
      for (const existingAssignment of student.assignments) {
        await tx.studentSeatAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            isCurrent: false,
            vacatedAt: new Date(),
          },
        });

        await tx.seat.update({
          where: { id: existingAssignment.seatId },
          data: { status: SeatStatus.AVAILABLE },
        });
      }

      // 4. Create new assignment
      const now = new Date();
      await tx.studentSeatAssignment.create({
        data: {
          studentId: student.id,
          seatId: seat.id,
          assignedAt: now,
          isCurrent: true,
        },
      });

      // 5. Update target seat status to OCCUPIED
      await tx.seat.update({
        where: { id: seat.id },
        data: { status: SeatStatus.OCCUPIED },
      });

      // 6. Log activity
      await tx.activityLog.create({
        data: {
          action: 'SEAT_ASSIGNED',
          studentId: student.id,
          entityType: 'Seat',
          entityId: seat.id,
          metadata: JSON.stringify({ seatNumber: seat.seatNumber, studentName: student.name }),
        },
      });

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        status: SeatStatus.OCCUPIED,
        currentStudent: {
          id: student.id,
          name: student.name,
          mobile: student.mobile,
          photoUrl: student.photoUrl,
          shift: student.shift as Shift,
          locker: student.locker as Locker,
          admissionDate: student.admissionDate.toISOString(),
          feeCycleStartDate: student.feeCycleStartDate.toISOString(),
          monthlyFee: Number(student.monthlyFee),
          assignedAt: now.toISOString(),
        },
      };
    });
  }

  /**
   * Vacates a seat by seatNumber. Releases active student assignment and marks seat AVAILABLE.
   */
  static async vacateSeat(seatNumber: number): Promise<SeatWithStudent> {
    return prisma.$transaction(async (tx) => {
      const seat = await tx.seat.findUnique({
        where: { seatNumber },
        include: {
          assignments: {
            where: { isCurrent: true },
          },
        },
      });

      if (!seat) {
        throw new Error(`Seat ${seatNumber} does not exist.`);
      }

      const now = new Date();

      // Close all current assignments for this seat
      for (const assignment of seat.assignments) {
        await tx.studentSeatAssignment.update({
          where: { id: assignment.id },
          data: {
            isCurrent: false,
            vacatedAt: now,
          },
        });
      }

      // Mark seat AVAILABLE
      const updatedSeat = await tx.seat.update({
        where: { id: seat.id },
        data: { status: SeatStatus.AVAILABLE },
      });

      // Log vacate
      await tx.activityLog.create({
        data: {
          action: 'SEAT_VACATED',
          entityType: 'Seat',
          entityId: seat.id,
          metadata: JSON.stringify({ seatNumber: seat.seatNumber }),
        },
      });

      return {
        id: updatedSeat.id,
        seatNumber: updatedSeat.seatNumber,
        status: SeatStatus.AVAILABLE,
        currentStudent: null,
      };
    });
  }

  /**
   * Dedicated transfer flow: Moves a student from their current seat to a new available seat.
   */
  static async transferStudentSeat(studentId: string, newSeatNumber: number): Promise<SeatWithStudent> {
    return prisma.$transaction(async (tx) => {
      const targetSeat = await tx.seat.findUnique({
        where: { seatNumber: newSeatNumber },
        include: {
          assignments: { where: { isCurrent: true } },
        },
      });

      if (!targetSeat) {
        throw new Error(`Target seat ${newSeatNumber} does not exist.`);
      }

      if (targetSeat.status === SeatStatus.OCCUPIED || targetSeat.assignments.length > 0) {
        throw new Error(`Target seat ${newSeatNumber} is already occupied.`);
      }

      const student = await tx.student.findUnique({
        where: { id: studentId },
        include: {
          assignments: {
            where: { isCurrent: true },
            include: { seat: true },
          },
        },
      });

      if (!student) {
        throw new Error('Student not found.');
      }

      if (student.status !== 'ACTIVE') {
        throw new Error('Cannot assign seat to an archived student.');
      }

      const now = new Date();

      // 1. Vacate old seat(s)
      for (const oldAssignment of student.assignments) {
        await tx.studentSeatAssignment.update({
          where: { id: oldAssignment.id },
          data: {
            isCurrent: false,
            vacatedAt: now,
          },
        });

        await tx.seat.update({
          where: { id: oldAssignment.seatId },
          data: { status: SeatStatus.AVAILABLE },
        });
      }

      // 2. Create new assignment
      await tx.studentSeatAssignment.create({
        data: {
          studentId: student.id,
          seatId: targetSeat.id,
          assignedAt: now,
          isCurrent: true,
        },
      });

      // 3. Mark new seat OCCUPIED
      await tx.seat.update({
        where: { id: targetSeat.id },
        data: { status: SeatStatus.OCCUPIED },
      });

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          action: 'SEAT_CHANGED',
          studentId: student.id,
          entityType: 'Seat',
          entityId: targetSeat.id,
          metadata: JSON.stringify({
            studentName: student.name,
            newSeatNumber: targetSeat.seatNumber,
            previousSeats: student.assignments.map((a) => a.seat.seatNumber),
          }),
        },
      });

      return {
        id: targetSeat.id,
        seatNumber: targetSeat.seatNumber,
        status: SeatStatus.OCCUPIED,
        currentStudent: {
          id: student.id,
          name: student.name,
          mobile: student.mobile,
          photoUrl: student.photoUrl,
          shift: student.shift as Shift,
          locker: student.locker as Locker,
          admissionDate: student.admissionDate.toISOString(),
          feeCycleStartDate: student.feeCycleStartDate.toISOString(),
          monthlyFee: Number(student.monthlyFee),
          assignedAt: now.toISOString(),
        },
      };
    });
  }
}
