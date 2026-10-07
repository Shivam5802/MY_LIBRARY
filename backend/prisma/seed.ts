import { PrismaClient, Role, SeatStatus, Shift, Locker, StudentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const ownerUsername = process.env.SEED_OWNER_USERNAME;
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;

  const developerUsername = process.env.SEED_DEVELOPER_USERNAME;
  const developerPassword = process.env.SEED_DEVELOPER_PASSWORD;

  if (!ownerUsername || !ownerPassword) {
    throw new Error('SEED_OWNER_USERNAME and SEED_OWNER_PASSWORD must be defined in .env');
  }

  if (!developerUsername || !developerPassword) {
    throw new Error('SEED_DEVELOPER_USERNAME and SEED_DEVELOPER_PASSWORD must be defined in .env');
  }

  console.log('Seeding database with initial roles, users, and 92 seats...');

  // 1. Seed Owner User
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 12);
  const ownerUser = await prisma.user.upsert({
    where: { username: ownerUsername },
    update: {
      passwordHash: ownerPasswordHash,
      role: Role.OWNER,
    },
    create: {
      username: ownerUsername,
      passwordHash: ownerPasswordHash,
      role: Role.OWNER,
      name: 'Library Owner',
      email: 'owner@mylibrary.local',
      mobile: '9876543210',
    },
  });
  console.log(`✓ Owner account ready: id=${ownerUser.id}, username=${ownerUser.username}, role=${ownerUser.role}`);

  // 2. Seed Developer User
  const devPasswordHash = await bcrypt.hash(developerPassword, 12);
  const devUser = await prisma.user.upsert({
    where: { username: developerUsername },
    update: {
      passwordHash: devPasswordHash,
      role: Role.DEVELOPER,
    },
    create: {
      username: developerUsername,
      passwordHash: devPasswordHash,
      role: Role.DEVELOPER,
      name: 'System Developer',
      email: 'developer@mylibrary.local',
    },
  });
  console.log(`✓ Developer account ready: id=${devUser.id}, username=${devUser.username}, role=${devUser.role}`);

  // 3. Seed Exactly 92 Seats (Idempotent: Upsert seats 1 through 92)
  console.log('Verifying and initializing seats 1 through 92...');
  for (let seatNumber = 1; seatNumber <= 92; seatNumber++) {
    await prisma.seat.upsert({
      where: { seatNumber },
      update: {},
      create: {
        seatNumber,
        status: SeatStatus.AVAILABLE,
      },
    });
  }
  const totalSeats = await prisma.seat.count();
  console.log(`✓ Seats verified: Total ${totalSeats} seats exist in database.`);

  // 4. Development Seed: A few sample students to verify dashboard and seat interactions immediately
  if (process.env.NODE_ENV === 'development') {
    const studentCount = await prisma.student.count();
    if (studentCount === 0) {
      console.log('Adding development sample students...');
      // Sample 1: Active on Seat 1
      const student1 = await prisma.student.create({
        data: {
          name: 'Rahul Kumar',
          mobile: '9876543210',
          shift: Shift.FULL_DAY,
          locker: Locker.WITH_LOCKER,
          admissionDate: new Date('2026-09-12'),
          monthlyFee: 1200.0,
          status: StudentStatus.ACTIVE,
        },
      });
      const seat1 = await prisma.seat.findUnique({ where: { seatNumber: 1 } });
      if (seat1) {
        await prisma.studentSeatAssignment.create({
          data: {
            studentId: student1.id,
            seatId: seat1.id,
            isCurrent: true,
          },
        });
        await prisma.seat.update({
          where: { id: seat1.id },
          data: { status: SeatStatus.OCCUPIED },
        });
      }

      // Sample 2: Active on Seat 15
      const student2 = await prisma.student.create({
        data: {
          name: 'Priya Sharma',
          mobile: '9812345678',
          shift: Shift.MORNING,
          locker: Locker.WITHOUT_LOCKER,
          admissionDate: new Date('2026-09-27'),
          monthlyFee: 800.0,
          status: StudentStatus.ACTIVE,
        },
      });
      const seat15 = await prisma.seat.findUnique({ where: { seatNumber: 15 } });
      if (seat15) {
        await prisma.studentSeatAssignment.create({
          data: {
            studentId: student2.id,
            seatId: seat15.id,
            isCurrent: true,
          },
        });
        await prisma.seat.update({
          where: { id: seat15.id },
          data: { status: SeatStatus.OCCUPIED },
        });
      }

      // Sample 3: Active but unassigned
      await prisma.student.create({
        data: {
          name: 'Amit Verma',
          mobile: '9845612378',
          shift: Shift.EVENING,
          locker: Locker.WITHOUT_LOCKER,
          admissionDate: new Date('2026-10-01'),
          monthlyFee: 900.0,
          status: StudentStatus.ACTIVE,
        },
      });

      console.log('✓ Development sample students seeded.');
    }
  }

  console.log('Database seeding complete successfully.');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
