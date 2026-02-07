/**
 * Database Seed Script
 * Creates development data for testing
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-clinic' },
    update: {},
    create: {
      name: 'Demo Clinic',
      slug: 'demo-clinic',
      legalName: 'Demo Healthcare Pvt Ltd',
      email: 'admin@democlinic.com',
      phone: '9876543210',
      address: '123 Health Street',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      subscriptionPlan: 'professional',
      subscriptionStatus: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  console.log(`✅ Created tenant: ${tenant.name}`);

  // Create main branch
  const branch = await prisma.branch.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'MAIN',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Main Branch',
      code: 'MAIN',
      address: '123 Health Street',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      phone: '9876543210',
      email: 'main@democlinic.com',
      gstin: '08AABCU9603R1ZM',
      timezone: 'Asia/Kolkata',
      workingHours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '14:00' },
        sunday: null,
      },
      isActive: true,
    },
  });

  console.log(`✅ Created branch: ${branch.name}`);

  // Create users with different roles
  const users = [
    {
      phone: '9876543210',
      email: 'admin@democlinic.com',
      name: 'Admin User',
      role: UserRole.super_admin,
      password: 'Admin@123',
    },
    {
      phone: '9876543211',
      email: 'doctor@democlinic.com',
      name: 'Dr. Sharma',
      role: UserRole.doctor,
      password: 'Doctor@123',
      specialization: 'General Medicine',
      qualification: 'MBBS, MD',
      registrationNumber: 'RJ-12345',
      registrationCouncil: 'Rajasthan Medical Council',
    },
    {
      phone: '9876543212',
      email: 'nurse@democlinic.com',
      name: 'Nurse Priya',
      role: UserRole.nurse,
      password: 'Nurse@123',
    },
    {
      phone: '9876543213',
      email: 'reception@democlinic.com',
      name: 'Receptionist Raj',
      role: UserRole.receptionist,
      password: 'Reception@123',
    },
    {
      phone: '9876543214',
      email: 'pharmacist@democlinic.com',
      name: 'Pharmacist Amit',
      role: UserRole.pharmacist,
      password: 'Pharma@123',
    },
    {
      phone: '9876543215',
      email: 'labtech@democlinic.com',
      name: 'Lab Tech Suresh',
      role: UserRole.lab_tech,
      password: 'LabTech@123',
    },
    {
      phone: '9876543216',
      email: 'accountant@democlinic.com',
      name: 'Accountant Meera',
      role: UserRole.accountant,
      password: 'Account@123',
    },
  ];

  for (const userData of users) {
    const { password, ...userFields } = userData;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.upsert({
      where: {
        tenantId_phone: {
          tenantId: tenant.id,
          phone: userData.phone,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        passwordHash,
        ...userFields,
      },
    });

    // Assign user to branch
    await prisma.userBranch.upsert({
      where: {
        userId_branchId: {
          userId: user.id,
          branchId: branch.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        branchId: branch.id,
        isPrimary: true,
      },
    });

    console.log(`✅ Created user: ${user.name} (${user.role})`);
  }

  // Create sample patients
  const patients = [
    {
      phone: '9898989801',
      name: 'Rahul Kumar',
      email: 'rahul@example.com',
      gender: 'male',
      dateOfBirth: new Date('1990-05-15'),
      bloodGroup: 'B+',
      address: '456 Patient Lane',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302002',
    },
    {
      phone: '9898989802',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      gender: 'female',
      dateOfBirth: new Date('1985-08-22'),
      bloodGroup: 'A+',
      address: '789 Health Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302003',
    },
    {
      phone: '9898989803',
      name: 'Amit Singh',
      gender: 'male',
      dateOfBirth: new Date('1978-12-10'),
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      chronicConditions: ['Diabetes', 'Hypertension'],
    },
  ];

  for (const patientData of patients) {
    const patient = await prisma.patient.upsert({
      where: {
        tenantId_phone: {
          tenantId: tenant.id,
          phone: patientData.phone,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        firstVisitBranchId: branch.id,
        ...patientData,
      },
    });

    console.log(`✅ Created patient: ${patient.name}`);
  }

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Admin:       9876543210 / Admin@123');
  console.log('Doctor:      9876543211 / Doctor@123');
  console.log('Nurse:       9876543212 / Nurse@123');
  console.log('Receptionist: 9876543213 / Reception@123');
  console.log('Pharmacist:  9876543214 / Pharma@123');
  console.log('Lab Tech:    9876543215 / LabTech@123');
  console.log('Accountant:  9876543216 / Account@123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
