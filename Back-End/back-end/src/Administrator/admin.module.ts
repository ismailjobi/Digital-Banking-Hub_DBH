import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from 'src/CommonEntities/Users.entity';
import { adminAuthService } from './Auth/adminAuth.service';
import { LoginSessions } from 'src/CommonEntities/LoginSessions.entity';
import { adminSignup } from './DTO/AdminSignup.dto';
import { AdminDetails } from './DTO/AdminDetails.dto';
import { UpdateAdminDetails } from './DTO/UpdateAdminDetails.dto';
import { UpdateAdminEmail } from './DTO/UpdateAdminEmail.dto';
import { salarySheetGen } from './DTO/salarySheetGen.dto';
import { AllocateSalary } from './DTO/AllocateSalary.dto';
import { ForgetAdminPassword } from './DTO/ForgetAdminPassword.dto';
import { submitOtp } from './DTO/submitOtp.dto';
import { Role } from './Entities/Role.entity';
import { BaseSalary } from './Entities/BaseSalary.entity';
import { AttendanceReports } from './Entities/AttendanceReports.entity';
import { SalarySheet } from './Entities/SalarySheet.entity';
import { Authentication } from 'src/Authentication/Entities/auth.entitie';
import { ProductKeys } from './Entities/ProductKeys.entity';
import { TransactionEntity } from 'src/Employees/Entities/transaction.entity';
import { AdminOTP } from './Entities/AdminOTP.entity';

@Module({
  imports: [adminSignup, AdminDetails,UpdateAdminDetails,UpdateAdminEmail,salarySheetGen,AllocateSalary, ForgetAdminPassword, submitOtp, TypeOrmModule.forFeature([Role, BaseSalary, AttendanceReports, SalarySheet, ProductKeys, Authentication, Users, AdminOTP, LoginSessions, TransactionEntity]),
  ],
  controllers: [AdminController],
  providers: [AdminService, adminAuthService],
  exports: [AdminService],
})
export class AdminModule { }
