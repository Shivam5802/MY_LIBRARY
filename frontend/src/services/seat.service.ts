import type { SeatWithStudent } from '../types/auth';
import { staticDb } from '../mock/staticData';

export class SeatService {
  static async getAllSeats(): Promise<SeatWithStudent[]> {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getSeats();
  }

  static async getSeatByNumber(seatNumber: number): Promise<SeatWithStudent> {
    await new Promise((r) => setTimeout(r, 40));
    return staticDb.getSeatByNumber(seatNumber);
  }

  static async assignSeat(seatNumber: number, studentId: string): Promise<SeatWithStudent> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.assignSeat(seatNumber, studentId);
  }

  static async vacateSeat(seatNumber: number): Promise<SeatWithStudent> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.vacateSeat(seatNumber);
  }

  static async transferSeat(studentId: string, newSeatNumber: number): Promise<SeatWithStudent> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.transferSeat(studentId, newSeatNumber);
  }
}
