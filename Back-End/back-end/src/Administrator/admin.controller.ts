//#region : imports
import { BadRequestException, Body, ConflictException, Controller, Delete, Get, InternalServerErrorException, Param, Patch, Post, Put, Query, Req, UseGuards, UsePipes, ValidationPipe, Request, Res, UnauthorizedException } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterError, diskStorage } from "multer";
import { randomBytes } from "crypto";
import { extname, join } from "path";
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { adminAuthGuard } from './Auth/adminAuth.guard';
import { JwtService } from "@nestjs/jwt";
import { Readable } from 'stream';
import * as ExcelJS from 'exceljs';
import { adminSignup } from "./DTO/AdminSignup.dto";
import { submitOtp } from "./DTO/submitOtp.dto";
import { AdminDetails } from "./DTO/AdminDetails.dto";
import { UpdateAdminDetails } from "./DTO/UpdateAdminDetails.dto";
import { UpdateAdminEmail } from "./DTO/UpdateAdminEmail.dto";
import { ForgetAdminPassword } from "./DTO/ForgetAdminPassword.dto";
import { AllocateSalary } from "./DTO/AllocateSalary.dto";
import { AttendanceReports } from "./Entities/AttendanceReports.entity";
import { salarySheetGen } from "./DTO/salarySheetGen.dto";


//#endregion: imports

const tempFolder = './uploads/admin/temp';
const storageFolder = './uploads/admin/storage';

@Controller('/admin')
export class AdminController {
    constructor(private readonly adminService: AdminService,
        private readonly jwtService: JwtService
    ) { }

    //#region : Role
    @UseGuards(adminAuthGuard)
    @Post("/role/create")
    @UsePipes(new ValidationPipe)
    async CreateRole(@Body() data: Object, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            throw new UnauthorizedException("Invalid Auth Token.");
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        return {
            message: "Role Created Successfully",
            RoleID: await this.adminService.CreateRole(data["Name"]),
            status:1
        }
    }
    @UseGuards(adminAuthGuard)
    @Patch("/role/update/:id")
    @UsePipes(new ValidationPipe)
    async UpdateRole(@Param("id") id: string, @Body() data, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            throw new UnauthorizedException("Invalid Auth Token.");
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        let res = await this.adminService.updateRole(id, data["Name"]);
        if (!res) {
            return {
                message: "Role Not Updated.",
            }
        }
        else {
            return {
                message: "Role Updated Successfully.",
                status:1
            }
        }
    }
    @UseGuards(adminAuthGuard)
    @Delete("/role/delete/:id")
    @UsePipes(new ValidationPipe)
    async DeleteRole(@Param("id") id: string, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            throw new UnauthorizedException("Invalid Auth Token.");
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        let res = await this.adminService.deleteRole(id);
        if (!res) {
            return {
                message: "This Role Cannot be Deleted.",
            }
        }
        else {
            return {
                message: "Role Deleted Successfully.",
                status:1
            }
        }
    }
    @UseGuards(adminAuthGuard)
    @Get("/role/getall")
    @UsePipes(new ValidationPipe)
    async GetAllRoles(@Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            throw new UnauthorizedException("Invalid Auth Token.");
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        return {
            message: "Operation Successful",
            data: await this.adminService.getAllRoles()
        }
    }
    //#endregion : Role

    //#region : Admin

    @Post("/signup")
    @UsePipes(new ValidationPipe)
    async SignupAdmin(@Body() data: adminSignup): Promise<Object> {
        const result = await this.adminService.signupAdmin(data);
        if (result == 1) {
            return {
                message: "OTP Sent to your email successfully. Submit OTP and complete signup process.",
                status: 1
            }
        }
        else if (result == -1) {
            throw new ConflictException('Email already exists');
        }
        else if (result == 0) {
            throw new BadRequestException('Invalid Activation Key');
        }
        else if (result == -3) {
            throw new InternalServerErrorException('OTP Not Sent');
        }
        else if (result == 2) {
            throw new InternalServerErrorException("Database Operation for Signup is Failed.");
        }
    }

    @Post("/signup/otpSubmit")
    @UsePipes(new ValidationPipe)
    async SubmitOtpForSignupAdmin(@Body() data: submitOtp): Promise<Object> {
        const result = await this.adminService.submitOtpForAdminSignup(data);
        if (result == 1) {
            return {
                message: "OTP Verified Successfully. Submit Account Details and complete signup process.",
                status: 1
            }
        }
        else if (result == 0) {
            throw new BadRequestException('OTP not Matched');
        }
        else if (result == -1) {
            throw new BadRequestException('No admin authentication data found associated with this email');
        }
        else if (result == -2) {
            throw new BadRequestException('No admin OTP data found associated with this email');
        }
        else if (result == -3) {
            throw new InternalServerErrorException("Database Operation for OTP verification is failed.");
        }
    }

    @Post("/provideDetails")
    @UsePipes(new ValidationPipe)
    @UseInterceptors(FileInterceptor('picture',
        {
            fileFilter: (req, file, cb) => {
                if (file.originalname.match(/^.*\.(jpg|png|jpeg)$/)) {
                    cb(null, true);
                } else {
                    cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
                }
            },
            limits: { fileSize: 500000 },// 4 megabit
            storage: diskStorage({
                destination: tempFolder,
                filename: function (req, file, cb) {
                    const randomBytesBuffer = randomBytes(4);
                    let ranNum = parseInt(randomBytesBuffer.toString('hex'), 16) % 100000000; ////8 digit -> 10e8
                    const extension = extname(file.originalname);
                    cb(null, Date.now() + ranNum.toString() + extension)
                },
            })
        }))
    async insertAdminDetails(@Body() data: AdminDetails, @UploadedFile() picture: Express.Multer.File): Promise<Object> {
        try {
            const result = await this.adminService.findVerifiedAdminByEmail(data.Email);
            if (result == false) {
                throw new BadRequestException("No Admin found associated with this email.");
            }
            const user = await this.adminService.findAdminDetailsByEmail(data.Email);
            if (user != false) {
                throw new BadRequestException("Admin Details already exist.");
            }
            if (await this.adminService.insertAdminDetails(data, picture.filename)) {
                const sourcePath = join(tempFolder, picture.filename);
                const destinationPath = join(storageFolder, picture.filename);
                if (!existsSync(storageFolder)) {
                    mkdirSync(storageFolder, { recursive: true });
                }
                renameSync(sourcePath, destinationPath);

                return {
                    message: "Account Details Added Successfully.",
                    status: 1
                };
            } else {
                throw new InternalServerErrorException("Database Operation for Account Details Insertion is Failed.");
            }
        } catch (error) {
            // Delete the file if insertion fails
            await this.deleteTempPicture(picture.filename);
            throw error;
        }
    }
    async deleteTempPicture(filename: string): Promise<boolean> {
        const filePath = join(tempFolder, filename);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
            return true;
        }
        return false;
    }
    @UseGuards(adminAuthGuard)
    @Get("/delete/:email")
    @UsePipes(new ValidationPipe)
    async deleteAdmin(@Param("email") email: string): Promise<Object> {
        const data = await this.adminService.findVerifiedAdminByEmail(email);
        if (data == false) {
            throw new BadRequestException("No Admin found associated with this email.");
        }
        if (await this.adminService.deleteAdmin(email)) {
            return {
                message: "Admin Account Deleted Successfully."
            }
        }
        throw new InternalServerErrorException("Account Deletion Failed.");
    }
    @UseGuards(adminAuthGuard)
    @Patch("/update/details")
    @UsePipes(new ValidationPipe)
    async updateAdminDetails(@Body() data: UpdateAdminDetails, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        if (await this.adminService.updateAdminDetails(data, payload.email) == true) {
            return {
                message: "Admin Account Details updated Successfully."
            }
        }
        throw new InternalServerErrorException("Account Details update failed.");
    }
    @UseGuards(adminAuthGuard)
    @Patch("/update/profilePicture")
    @UsePipes(new ValidationPipe)
    @UseInterceptors(FileInterceptor('picture',
        {
            fileFilter: (req, file, cb) => {
                if (file.originalname.match(/^.*\.(jpg|png|jpeg)$/)) {
                    cb(null, true);
                } else {
                    cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
                }
            },
            limits: { fileSize: 500000 },// 4 megabit
            storage: diskStorage({
                destination: tempFolder,
                filename: function (req, file, cb) {
                    const randomBytesBuffer = randomBytes(4);
                    let ranNum = parseInt(randomBytesBuffer.toString('hex'), 16) % 100000000; ////8 digit -> 10e8
                    const extension = extname(file.originalname);
                    cb(null, Date.now() + ranNum.toString() + extension)
                },
            })
        }))
    async updateAdminProfilePicture(@UploadedFile() picture: Express.Multer.File, @Request() req): Promise<Object> {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const payload = this.jwtService.decode(token) as { email: string, role: string };
            const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
            if (exData == null) {
                throw new BadRequestException("No Admin found associated with this credentials.");
            }
            if (await this.adminService.updateAdminProfilePicture(payload.email, picture.filename) == true) {
                const sourcePath = join(tempFolder, picture.filename);
                const destinationPath = join(storageFolder, picture.filename);
                if (!existsSync(storageFolder)) {
                    mkdirSync(storageFolder, { recursive: true });
                }
                renameSync(sourcePath, destinationPath);

                return {
                    message: "Admin Account Profile Picture updated Successfully."
                }
            }
            throw new InternalServerErrorException("Profile Picture update operation failed due to database error.");
        } catch (error) {
            await this.deleteTempPicture(picture.filename);
            throw error;
        }
    }
    @UseGuards(adminAuthGuard)
    @Get("/profile/get/data")
    @UsePipes(new ValidationPipe)
    async GetProfileData(@Request() req): Promise<Object> {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const payload = this.jwtService.decode(token) as { email: string, role: string };
            const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
            if (exData == null) {
                throw new BadRequestException("No Admin found associated with this credentials.");
            }
            const result = await this.adminService.getAdminDetails(payload.email);
            if (result != null) {
                return {
                    message: "Operation Successful.",
                    userId: result.userId,
                    Email: result.Email,
                    FullName: result.FullName,
                    Gender: result.Gender,
                    DateOfBirth: result.DOB,
                    NID: result.NID,
                    Phone: result.Phone,
                    Address: result.Address,
                }
            }
            throw new InternalServerErrorException("Profile Picture update operation failed due to database error.");
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    @UseGuards(adminAuthGuard)
    @Get("/profile/get/profilePicture")
    @UsePipes(new ValidationPipe)
    async GetProfilePicture(@Res() res, @Request() req): Promise<Object> {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const payload = this.jwtService.decode(token) as { email: string, role: string };
            const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
            if (exData == null) {
                throw new BadRequestException("No Admin found associated with this credentials.");
            }
            const result = await this.adminService.getAdminDetails(payload.email);
            if (result != null) {
                return {
                    message: "Operation Successful.",
                    File: res.sendFile(result.FileName, { root: './uploads/admin/storage/' })
                }
            }
            throw new InternalServerErrorException("Profile Picture update operation failed due to database error.");
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    @UseGuards(adminAuthGuard)
    @Get("/profile/get/profilePicture/:picturename")
    @UsePipes(new ValidationPipe)
    async GetSpecificProfilePicture(@Param("picturename") picturename:string, @Res() res, @Request() req): Promise<Object> {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const payload = this.jwtService.decode(token) as { email: string, role: string };
            const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
            if (exData == null) {
                throw new BadRequestException("No Admin found associated with this credentials.");
            }
            return {
                message: "Operation Successful.",
                File: res.sendFile(picturename, { root: './uploads/admin/storage/' })
            }
        } catch (error) {
            console.log(error);
            throw new InternalServerErrorException("Profile Picture update operation failed due to database error.=>",error);
        }
    }
    @UseGuards(adminAuthGuard)
    @Patch("/update/email")
    @UsePipes(new ValidationPipe)
    async updateAdminEmail(@Body() data: UpdateAdminEmail, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        if (await this.adminService.sendOTPforUpdateAdminEmail(data.NewEmail) == true) {
            return {
                message: "OTP Sent to your email successfully. Submit OTP and complete email update process.",
            }
        }
        throw new InternalServerErrorException("Email update failed.");
    }
    @UseGuards(adminAuthGuard)
    @Post("/update/email/submitOtp")
    @UsePipes(new ValidationPipe)
    async submitOtpForUpdateAdminEmail(@Body() data: submitOtp, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            return {
                message: "Invalid Auth Token.",
            }
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        if (await this.adminService.verifyOTPforUpdateAdminEmail(data, payload.email) == 1) {
            return {
                message: "Email updated Successfully. Now re-login for get updated auth token.",
            }
        }
        else {
            throw new InternalServerErrorException("Invalid OTP. Email update failed.");
        }
    }

    @Post("/forgetPassword")
    @UsePipes(new ValidationPipe)
    async sendOTPforForgetAdminPassword(@Body() data: Object): Promise<Object> {

        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(data["email"]);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        if (await this.adminService.sendOTPforForgetAdminPassword(data["email"]) == true) {
            return {
                message: "OTP Sent to your email successfully. Submit OTP and complete password reset process.",
            }
        }
        throw new InternalServerErrorException("Failed to send OTP");
    }

    @Post("/forgetPassword/submitOtp")
    @UsePipes(new ValidationPipe)
    async submitOtpForForgetAdminPassword(@Body() data: ForgetAdminPassword): Promise<Object> {

        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(data.Email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        if (await this.adminService.verifyOTPforForgetAdminPassword(data, exData) == 1) {
            return {
                message: "Password reset Successfully. Now re-login for get updated auth token.",
            }
        }
        else {
            throw new InternalServerErrorException("Invalid OTP. Password reset failed.");
        }
    }
    //#endregion : Admin

    //#region : Allocate Salary based on Role

    @UseGuards(adminAuthGuard)
    @Put("/allocateSalary")
    @UsePipes(new ValidationPipe)
    async allocateSalaryBasedOnRole(@Body() data: AllocateSalary, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            return {
                message: "Invalid Auth Token.",
            }
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        const dbRoldId = await this.adminService.getRoleIdByName(data.RoleName);
        if (dbRoldId == null) {
            throw new BadRequestException("No Role found with this name.");
        }
        if (await this.adminService.allocateSalaryBasedOnRole(dbRoldId, data.Salary) == true) {
            return {
                message: "Salary allocated Successfully.",
            }
        }
        throw new InternalServerErrorException("Salary allocation failed due to database error");
    }

    @UseGuards(adminAuthGuard)
    @Get("/allocatedSalary/get/:roleName")
    @UsePipes(new ValidationPipe)
    async getRoleBasedSalaryInfo(@Param("roleName") roleName: string, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            return {
                message: "Invalid Auth Token.",
            }
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        const dbRoldId = await this.adminService.getRoleIdByName(roleName);
        if (dbRoldId == null) {
            throw new BadRequestException("No Role found with this name.");
        }
        const res = await this.adminService.getRoleBasedSalaryInfo(dbRoldId);
        if (res != null) {
            return {
                message: "Operation Successful",
                data: res
            }
        }
        throw new InternalServerErrorException("Operation failed due to database error");
    }

    //#endregion : Allocate Salary based on Role

    //#region : attendance

    @Post("/attendance/import")
    @UseGuards(adminAuthGuard)
    @UsePipes(new ValidationPipe)
    @UseInterceptors(FileInterceptor('file'))
    async importAttendanceXlsxData(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const workbook = new ExcelJS.Workbook();
        const stream = Readable.from(file.buffer);

        const rows: AttendanceReports[] = [];
        await workbook.xlsx.read(stream)
            .then(function () {
                const worksheet = workbook.worksheets[0]; // Assuming data is in the first worksheet
                worksheet.eachRow(function (row, rowNumber) {
                    if (rowNumber !== 1) { // Skip the header row
                        const attendanceReport = new AttendanceReports();
                        attendanceReport.Year = parseInt(row.getCell(1).value as string); //Year
                        attendanceReport.Email = row.getCell(2).value as string; //Email
                        attendanceReport.Jan = parseInt(row.getCell(3).value as string);
                        attendanceReport.Feb = parseInt(row.getCell(4).value as string);
                        attendanceReport.Mar = parseInt(row.getCell(5).value as string);
                        attendanceReport.Apr = parseInt(row.getCell(6).value as string);
                        attendanceReport.May = parseInt(row.getCell(7).value as string);
                        attendanceReport.Jun = parseInt(row.getCell(8).value as string);
                        attendanceReport.Jul = parseInt(row.getCell(9).value as string);
                        attendanceReport.Aug = parseInt(row.getCell(10).value as string);
                        attendanceReport.Sep = parseInt(row.getCell(11).value as string);
                        attendanceReport.Oct = parseInt(row.getCell(12).value as string);
                        attendanceReport.Nov = parseInt(row.getCell(13).value as string);
                        attendanceReport.Dec = parseInt(row.getCell(14).value as string);
                        rows.push(attendanceReport);
                    }
                });
            })
            .catch(function (error) {
                console.error('Error reading Excel file:', error);
            });
        if (await this.adminService.importAttendanceXlsxDataToDB(rows) == false) {
            throw new InternalServerErrorException('Data not saved to database');
        }

        return {
            message: 'Excel file uploaded and data imported successfully',
            status: 1
        };
    }

    @UseGuards(adminAuthGuard)
    @Get("/attendance/getReport")
    @UsePipes(new ValidationPipe)
    async getAttendanceReport(@Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            return {
                message: "Invalid Auth Token.",
            }
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        const res = await this.adminService.getAttendanceReport();
        if (res != null) {
            return {
                message: "Operation Successful",
                data: res
            }
        }
        throw new InternalServerErrorException("Attendance Report generation failed due to database error");
    }
    //#endregion : attendance

    //#region : Salary Sheet

    @UseGuards(adminAuthGuard)
    @Post("/salarySheet/generate")
    @UsePipes(new ValidationPipe)
    async genSalarySheetByMonthAndYear(@Body() data: salarySheetGen, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            return {
                message: "Invalid Auth Token.",
            }
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        const res = await this.adminService.genSalarySheet(data);
        if (res != null) {
            return {
                message: "Operation Successful",
                data: res
            }
        }
        throw new InternalServerErrorException("Salary generation failed due to database error");
    }
    //#endregion : Salary Sheet

    //#region : users

    @UseGuards(adminAuthGuard)
    @Get("/getDetails/allUsers")
    @UsePipes(new ValidationPipe)
    async getAllUsersDetails(@Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            throw new UnauthorizedException("Invalid Auth Token");
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        const res = await this.adminService.getAllUsersDetails();
        if (res != null) {
            return {
                message: "Operation Successful",
                data: res
            }
        }
        throw new InternalServerErrorException("Users details getting operation failed due to database error");
    }

    @UseGuards(adminAuthGuard)
    @Post("/deActivate")
    @UsePipes(new ValidationPipe)
    async deActivateUser(@Body() data: Object, @Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            return {
                message: "Invalid Auth Token.",
            }
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        const res = await this.adminService.deActivateUser(data["email"]);
        if (res != null) {
            return {
                message: "Operation Successful",
            }
        }
        throw new InternalServerErrorException("Users not deactivated.");
    }

    //#endregion : users

    //#region : Dashboard

    @UseGuards(adminAuthGuard)
    @Get("/showReport")
    @UsePipes(new ValidationPipe)
    async showDashboardReport(@Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            throw new BadRequestException("Invalid Auth Token.");
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        const res = await this.adminService.showDashboardDailyTransactionReport();
        if (res != null) {
            return {
                message: "Operation Successful",
                Data: res
            }
        }
        throw new InternalServerErrorException("Report not generated.");
    }

    //#endregion : Dashboard

    //#region : Logout 

    @UseGuards(adminAuthGuard)
    @Delete("/logout")
    @UsePipes(new ValidationPipe)
    async logout(@Request() req): Promise<Object> {
        const token = req.headers.authorization.split(' ')[1];
        const payload = this.jwtService.decode(token) as { email: string, role: string };
        if (payload.role != await this.adminService.getRoleIdByName("admin")) {
            throw new BadRequestException("Invalid Auth Token");
        }
        const exData = await this.adminService.findVerifiedAdminByEmailForAuth(payload.email);
        if (exData == null) {
            throw new BadRequestException("No Admin found associated with this credentials.");
        }
        const res = await this.adminService.logoutAndDeleteSessionData(payload.email, token);
        if (res) {
            return {
                message: "Logout Successful",
                status: 1
            }
        }
        throw new InternalServerErrorException("Logout failed !");
    }

    //#endregion: Logout
}