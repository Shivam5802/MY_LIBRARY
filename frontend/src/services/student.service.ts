import type { StudentWithSeat, Shift, Locker, StudentStatus } from '../types/auth';
import { staticDb } from '../mock/staticData';

export interface CreateStudentPayload {
  name: string;
  mobile: string;
  photoUrl?: string | null;
  shift: Shift;
  locker: Locker;
  admissionDate: string;
  feeCycleStartDate: string;
  monthlyFee: number;
  seatNumber?: number | null;
}

export interface UpdateStudentPayload {
  name?: string;
  mobile?: string;
  photoUrl?: string | null;
  shift?: Shift;
  locker?: Locker;
  admissionDate?: string;
  feeCycleStartDate?: string;
  monthlyFee?: number;
}

export interface StudentFilterQuery {
  search?: string;
  status?: StudentStatus;
  shift?: Shift;
  locker?: Locker;
  hasSeat?: boolean;
}

export class StudentService {
  static async getStudents(filters: StudentFilterQuery = {}): Promise<StudentWithSeat[]> {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getStudents(filters);
  }

  static async getStudentById(id: string): Promise<StudentWithSeat> {
    await new Promise((r) => setTimeout(r, 40));
    return staticDb.getStudentById(id);
  }

  static async createStudent(payload: CreateStudentPayload): Promise<StudentWithSeat> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.createStudent(payload);
  }

  static async updateStudent(id: string, payload: UpdateStudentPayload): Promise<StudentWithSeat> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.updateStudent(id, payload);
  }

  static async archiveStudent(id: string): Promise<StudentWithSeat> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.archiveStudent(id);
  }

  static async restoreStudent(id: string): Promise<StudentWithSeat> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.restoreStudent(id);
  }

  static async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    await new Promise((r) => setTimeout(r, 100));
    return staticDb.deleteStudent(id);
  }
}
