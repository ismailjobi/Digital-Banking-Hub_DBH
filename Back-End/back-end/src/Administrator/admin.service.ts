import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, MoreThan, Repository } from 'typeorm';
import { Users } from 'src/CommonEntities/Users.entity';
import { add, parse } from 'date-fns';
import { randomBytes } from 'crypto';
import { Console } from 'console';
import path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginSessions } from 'src/CommonEntities/LoginSessions.entity';
import { Role } from './Entities/Role.entity';
import { SalarySheet } from './Entities/SalarySheet.entity';
import { ProductKeys } from './Entities/ProductKeys.entity';
import { BaseSalary } from './Entities/BaseSalary.entity';
import { AttendanceReports } from './Entities/AttendanceReports.entity';
import { Authentication } from 'src/Authentication/Entities/auth.entitie';
import { AdminOTP } from './Entities/AdminOTP.entity';
import { TransactionEntity } from 'src/Employees/Entities/transaction.entity';
import { adminSignup } from './DTO/AdminSignup.dto';
import { submitOtp } from './DTO/submitOtp.dto';
import { AdminDetails } from './DTO/AdminDetails.dto';
import { UpdateAdminDetails } from './DTO/UpdateAdminDetails.dto';
import { ForgetAdminPassword } from './DTO/ForgetAdminPassword.dto';
import { salarySheetGen } from './DTO/salarySheetGen.dto';
const nodemailer = require('nodemailer');

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        @InjectRepository(SalarySheet) private salarySheetRepository: Repository<SalarySheet>,
        @InjectRepository(ProductKeys) private productKeysRepository: Repository<ProductKeys>,
        @InjectRepository(BaseSalary) private baseSalaryRepository: Repository<BaseSalary>,
        @InjectRepository(AttendanceReports) private attendanceReportsRepository: Repository<AttendanceReports>,
        @InjectRepository(Authentication) private authenticationRepository: Repository<Authentication>,
        @InjectRepository(Users) private usersRepository: Repository<Users>,
        @InjectRepository(AdminOTP) private adminOTPRepository: Repository<AdminOTP>,
        @InjectRepository(LoginSessions) private loginSessionsRepository: Repository<LoginSessions>,
        @InjectRepository(TransactionEntity) private transactionRepository: Repository<TransactionEntity>,
        private jwtService: JwtService
    ) { }

    //#region : Role
    async CreateRole(name: string): Promise<string> {
        try {
            let exData = await this.roleRepository.find({
                where: { Name: name.toLowerCase() }
            });
            if (exData.length > 0) {
                return exData[0].Id;
            }
            let data = new Role();
            data.Name = name.toLowerCase();
            let cData = await this.roleRepository.save(data);
            return cData.Id;
        } catch (error) {
            console.error('Error while Creating role:', error);
            return "-1";
        }
    }
    async getRoleIdByName(name: string): Promise<string> {
        let exData = await this.roleRepository.find({
            where: { Name: name.toLowerCase() }
        });
        if (exData.length > 0) {
            return exData[0].Id;
        }
        return null;
    }
    async updateRole(id: string, newName: string): Promise<boolean> {
        const existingRole = await this.roleRepository.find({
            where: {
                Id: id
            }
        })

        if (existingRole.length == 0) {
            return false;
        }

        existingRole[0].Name = newName.toLowerCase();
        try {
            await this.roleRepository.save(existingRole[0]);
            return true;
        } catch (error) {
            console.error('Error while updating role:', error);
            return false;
        }
    }

    async deleteRole(id: string): Promise<boolean> {
        const existingRole = await this.roleRepository.find({
            where: {
                Id: id
            }
        })

        if (existingRole.length == 0) {
            return false;
        }
        try {
            await this.roleRepository.remove(existingRole[0]);
            return true;
        } catch (error) {
            console.error('This Role Cannot Be Deleted. Error:', error);
            return false;
        }
    }
    async getAllRoles(): Promise<Role[]> {
        return await this.roleRepository.find();
    }

    //#endregion : Role

    //#region : Admin
    async signupAdmin(data: adminSignup): Promise<Number> {
        try {
            let exData = await this.authenticationRepository.find({
                where: { Email: data.Email }
            });
            if (exData.length > 0) {
                return -1; //already exist
            }
            if (await this.ProductKeyMatched(data.ActivationKey) == false) {
                return 0; // Invalid Product Key
            }
            if (await this.sendOTP(data.Email) == false) {
                return -3; // OTP Not Sent
            }
            //hashing password
            const salt = await bcrypt.genSalt();
            data.Password = await bcrypt.hash(data.Password, salt);

            await this.authenticationRepository.save(await this.AdminSignupDTOtoAuthentication(data));
            return 1; //success
        } catch (error) {
            console.error('Error while Creating Admin:', error);
            return -2;
        }
    }
    async sendOTP(receiverEmail: string): Promise<boolean> {
        let flag = false;
        try {
            const randomBytesBuffer = randomBytes(4);
            let ranNum = parseInt(randomBytesBuffer.toString('hex'), 16) % 100000000; //8 digit -> 10e8
            // console.log("1");
            let otpData: AdminOTP;
            let exData = await this.adminOTPRepository.find({
                where: { Email: receiverEmail }
            });
            // console.log("2");
            if (exData.length > 0) {
                otpData = exData[0];
                otpData.Otp = ranNum.toString();
                otpData.Verified = false;
                // console.log("3");
            }
            else {
                otpData = new AdminOTP();
                otpData.Email = receiverEmail;
                otpData.Otp = ranNum.toString();
                otpData.Verified = false;
                // console.log("4");
            }
            // console.log("4.5");
            let cData = await this.adminOTPRepository.save(otpData);
            // console.log("5");
            if (cData == null) {
                return false;
            }
            // const transporter = nodemailer.createTransport({
            //     host: 'smtp-mail.outlook.com',
            //     port: 587,
            //     auth: {
            //         user: authInfo.email,
            //         pass: authInfo.password
            //     }
            // });

            // const mailOptions = {

            //     from: authInfo.email,
            //     to: receiverEmail,
            //     subject: 'Digital Banking Hub - OTP verification',
            //     text: "OTP: " + ranNum
            // };

            // await new Promise((resolve, reject) => {
            //     transporter.sendMail(mailOptions, function (error, info) {
            //         if (error) {
            //             reject(error);
            //             // console.log("6");
            //         } else {
            //             // console.log("7");
            //             flag = true;
            //             resolve(info.response);
            //         }
            //     });
            // });
            // console.log("8");
            return flag;
        } catch (error) {
            console.error('Error while sending OTP:', error);
            // console.log("9");
            return false;
        }
    }
    async submitOtpForAdminSignup(data: submitOtp): Promise<Number> {
        try {
            let user = await this.findAdminByEmail(data.email);
            if (user == null) {
                return -1; //User not found in auth table
            }
            let exOtpData = await this.adminOTPRepository.find({
                where: { Email: data.email }
            });
            if (exOtpData.length == 0) {
                return -2; //User not found in OTP table
            }
            if (exOtpData[0].Otp != null && exOtpData[0].Otp == data.otp) {
                exOtpData[0].Verified = true;
                exOtpData[0].Otp = null;
                await this.adminOTPRepository.save(exOtpData);
                return 1; //OTP verified
            }
            return 0; //invalid OTP
        }
        catch (error) {
            return -3; //Database related error
        }
    }
    async AdminSignupDTOtoAuthentication(data: adminSignup): Promise<Authentication> {
        let newData = new Authentication();
        newData.Email = data.Email;
        newData.Password = data.Password;
        newData.Active = false;
        newData.RoleID = await this.CreateRole("admin");
        return newData;
    }
    async ProductKeyMatched(key: string): Promise<boolean> {
        let flag = false;
        const exData = await this.productKeysRepository.find({
            where: {
                Key: key
            }
        })
        flag = exData.length > 0;
        //#region : Delete Product Key
        // if (flag) {
        //     try {
        //         await this.productKeysRepository.remove(exData[0]);
        //     }
        //     catch (error) {
        //         flag = false; // error
        //     }
        // }
        //#endregion: Delete Product Key
        return flag;
    }
    async findAdminByEmail(email: string): Promise<Authentication | boolean> {
        try {
            let exData = await this.authenticationRepository.find({
                where: { Email: email, RoleID: await this.getRoleIdByName("admin") }
            });
            if (exData.length == 0) {
                return false; //Admin not found
            }
            return exData[0];
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    async findVerifiedAdminByEmailForAuth(email: string): Promise<Authentication | null> {
        try {
            // console.log(email);
            let exData = await this.authenticationRepository.find({
                where: { Email: email, RoleID: await this.getRoleIdByName("admin"), Active: true }
            });
            // console.log(exData);
            if (exData.length == 0) {
                return null; //Admin not found
            }
            return exData[0];
        }
        catch (error) {
            // console.log(error);
            return null;
        }
    }
    async findVerifiedAdminByEmail(email: string): Promise<Authentication | boolean> {
        try {
            let exData = await this.authenticationRepository.find({
                where: { Email: email, RoleID: await this.getRoleIdByName("admin") }
            });
            if (exData.length == 0) {
                return false; //Admin not found
            }
            let exOtpData = await this.adminOTPRepository.find({
                where: { Email: email, Verified: true }
            });
            if (exOtpData.length == 0) {
                return false; //Admin not verified
            }
            return exData[0];
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    async findAdminDetailsByEmail(email: string): Promise<Users | boolean> {
        try {
            let exData = await this.usersRepository.find({
                where: { Email: email }
            });
            if (exData.length == 0) {
                return false; //User not found
            }
            return exData[0];
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    async insertAdminDetails(data: AdminDetails, fileName: string): Promise<boolean> {
        try {

            let cData = await this.usersRepository.save(await this.AdminDetailsDTOtoUser(data, fileName));
            let adminData = await this.authenticationRepository.find({
                where: { Email: data.Email, RoleID: await this.getRoleIdByName("admin") }
            });
            adminData[0].Active = true;
            let res = await this.authenticationRepository.save(adminData[0]);
            return res != null; //success
        } catch (error) {
            console.error('Error while Creating Admin:', error);
            return false;
        }
    }
    async updateAdminDetails(data: UpdateAdminDetails, email: string): Promise<boolean> {
        try {
            let exData = await this.usersRepository.find({
                where: { Email: email }
            });
            exData[0].Phone = data.Phone;
            exData[0].FullName = data.FullName;
            exData[0].Gender = data.Gender;
            exData[0].DOB = data.DateOfBirth;
            exData[0].NID = data.NID;
            exData[0].Address = data.Address;
            let cData = await this.usersRepository.save(exData[0]);
            return cData != null; //success
        } catch (error) {
            console.error('Error while Creating Admin:', error);
            return false;
        }
    }

    async sendOTPforUpdateAdminEmail(newEmail: string): Promise<boolean> {
        try {
            if (await this.sendOTP(newEmail) == true) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error while sending OTP for Update Admin Email:', error);
            return false;
        }
    }
    async verifyOTPforUpdateAdminEmail(data: submitOtp, prevEmail: string): Promise<Number> {
        try {
            let exOtpData = await this.adminOTPRepository.find({
                where: { Email: data.email }
            });
            if (exOtpData.length == 0) {
                return -2; //User not found in OTP table
            }
            if (exOtpData[0].Otp != null && exOtpData[0].Otp == data.otp) {
                exOtpData[0].Verified = true;
                exOtpData[0].Otp = null;
                if (await this.adminOTPRepository.save(exOtpData) == null) {
                    return -3; //error in otp table
                }
                let adData = await this.authenticationRepository.find({
                    where: { Email: prevEmail }
                });
                if (adData.length == 0) {
                    return -4; //no admin found in auth table
                }
                // adData[0].Email = data.email;
                let exOTPTableData = await this.adminOTPRepository.find({
                    where: { Email: prevEmail }
                });
                if (exOTPTableData.length == 0) {
                    return -6; //prev email not found in admin otp table
                }
                if ((await this.authenticationRepository.update({ Email: prevEmail }, { Email: data.email })) && (await this.adminOTPRepository.remove(exOTPTableData[0]) != null)) {
                    return 1; //OTP verified
                }
                return -5; //failed
            }
            return 0; //invalid OTP
        }
        catch (error) {
            return -3; //Database related error
        }
    }
    async AdminDetailsDTOtoUser(data: AdminDetails, fileName: string): Promise<Users> {
        let newData = new Users();
        newData.Email = data.Email;
        newData.FullName = data.FullName;
        newData.FileName = fileName;
        // newData.DOB = parse(data.DateOfBirth.toString(), 'dd-MM-yyyy', new Date());
        newData.DOB = data.DateOfBirth;
        newData.Gender = data.Gender;
        newData.NID = data.NID;
        newData.Phone = data.Phone;
        newData.Address = data.Address;
        return newData;
    }
    async deleteAdmin(email: string): Promise<boolean> {
        try {
            let userData = await this.usersRepository.find({
                where: { Email: email }
            });
            let adminData = await this.authenticationRepository.find({
                where: { Email: email, RoleID: await this.getRoleIdByName("admin") }
            });
            if (userData.length == 0 || adminData.length == 0) {
                return false;
            }
            if (await this.authenticationRepository.remove(adminData) == undefined) {
                return false;
            }
            const filePath = path.join(__dirname, '../..', 'uploads', 'admin', 'storage', userData[0].FileName);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    // console.error('Error deleting file:', error);
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            // console.log(error);
            return false;
        }
    }
    async updateAdminProfilePicture(email: string, fileName: string): Promise<boolean> {
        try {
            let adminData = await this.usersRepository.find({
                where: { Email: email }
            });
            if (adminData.length == 0) {
                return false;
            }
            let prevFileName = adminData[0].FileName;
            adminData[0].FileName = fileName;
            let cData = await this.usersRepository.save(adminData[0]);
            if (cData == null) {
                return false;
            }
            const filePath = path.join(__dirname, '../..', 'uploads', 'admin', 'storage', prevFileName);
            if (fs.existsSync(filePath)) {
                try {
                    await fs.unlinkSync(filePath);
                    return true; // File deleted successfully
                } catch (error) {
                    console.error('Error deleting file:', error);
                    return false; // Error deleting file
                }
            } else {
                console.error('File does not exist:', filePath);
                return false; // File does not exist
            }
        } catch (error) {
            console.error('Error while Creating Admin:', error);
            return false;
        }
    }
    async getAdminDetails(email: string): Promise<Users> {
        try {
            let exData = await this.usersRepository.find({
                where: { Email: email }
            });
            if (exData.length == 0) {
                return null; //Admin not found
            }
            return exData[0];
        }
        catch (error) {
            // console.log(error);
            return null;
        }
    }

    async sendOTPforForgetAdminPassword(email: string): Promise<boolean> {
        try {
            if (await this.sendOTP(email) == true) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error while sending OTP for forget Admin password:', error);
            return false;
        }
    }
    async verifyOTPforForgetAdminPassword(data: ForgetAdminPassword, previousAuthData: Authentication): Promise<Number> {
        try {
            let exOtpData = await this.adminOTPRepository.find({
                where: { Email: data.Email }
            });
            if (exOtpData.length == 0) {
                return -2; //User not found in OTP table
            }
            if (exOtpData[0].Otp != null && exOtpData[0].Otp == data.otp) {

                exOtpData[0].Verified = true;
                exOtpData[0].Otp = null;
                if (await this.adminOTPRepository.save(exOtpData) == null) {
                    return -3; //error in otp table
                }
                //hashing password
                const salt = await bcrypt.genSalt();
                previousAuthData.Password = await bcrypt.hash(data.NewPassword, salt);
                const res = await this.authenticationRepository.save(previousAuthData);
                if (res != null) {
                    // !! Vulnerability: After this line users previous authentication token should removed. But here that code not written.
                    return 1; //password changed
                }
                return -5; //failed
            }
            return 0; //invalid OTP
        }
        catch (error) {
            console.log(error);
            return -3; //Database related error
        }
    }
    //#endregion : Admin

    //#region : Allocating Salary

    async allocateSalaryBasedOnRole(roleId: string, salary: number): Promise<boolean> {
        try {
            let exRoleData = await this.baseSalaryRepository.find({
                where: { RoleId: roleId }
            });
            if (exRoleData.length == 0) {
                const baseSal = new BaseSalary();
                baseSal.RoleId = roleId;
                baseSal.Salary = salary;
                if (await this.baseSalaryRepository.save(baseSal) != null) {
                    return true; //error in table
                }
                return false;
            }
            exRoleData[0].Salary = salary;
            if (await this.baseSalaryRepository.save(exRoleData[0]) != null) {
                return true; //error in table
            }
            return false;
        }
        catch (error) {
            console.log(error);
            return false; //Database related error
        }
    }

    async getRoleBasedSalaryInfo(roleId: string): Promise<BaseSalary> {
        try {
            let roleData = await this.baseSalaryRepository.find({
                where: { RoleId: roleId }
            });
            if (roleData.length == 0) {
                return null;
            }
            return roleData[0];
        }
        catch (error) {
            console.log(error);
            return null; //Database related error
        }
    }

    //#endregion : Allocating Salary

    //#region : attendance

    async importAttendanceXlsxDataToDB(data: AttendanceReports[]): Promise<boolean> {
        try {
            const authEmails = (await this.authenticationRepository.find({ select: ['Email'] })).map(auth => auth.Email);
            const filteredData = data.filter(row => authEmails.includes(row.Email));
            for (const row of filteredData) {
                const existingRecord = await this.attendanceReportsRepository.find({ where: { Year: row.Year, Email: row.Email } });
                if (existingRecord.length != 0) {
                    await this.attendanceReportsRepository.update(existingRecord[0], row);
                } else {
                    await this.attendanceReportsRepository.save(row);
                }
            }
            return true;
        } catch (error) {
            console.error('Error importing attendance data:', error);
            return false;
        }
    }
    async getAttendanceReport(): Promise<AttendanceReports[]> {
        try {
            return await this.attendanceReportsRepository.find();
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    //#endregion : attendance

    //#region : Salary Sheet

    async genSalarySheet(data: salarySheetGen): Promise<SalarySheet[]> {
        try {
            const attendanceData = await this.attendanceReportsRepository.find({
                where: { Year: data.year },
            });

            const authData = await this.authenticationRepository.find({
                select: ["Email", "RoleID"]
            });

            const baseSalaryData = await this.baseSalaryRepository.find();

            let salarySheets: SalarySheet[] = [];

            for (const attendance of attendanceData) {
                const { Email } = attendance;
                const authInfo = authData.find(auth => auth.Email === Email);
                const baseSalaryInfo = baseSalaryData.find(salary => salary.RoleId === authInfo.RoleID);
                let salarySheet = await this.salarySheetRepository.findOne({
                    where: { Year: data.year, Email: Email }
                });
                if (!salarySheet) {
                    salarySheet = new SalarySheet();
                    salarySheet.Year = data.year;
                    salarySheet.Email = Email;
                }

                salarySheet[data.month] = Math.round((attendance[data.month] || 0) * (baseSalaryInfo.Salary / 30.0));

                await this.salarySheetRepository.save(salarySheet);

                salarySheets.push(salarySheet);
            }

            return await this.salarySheetRepository.find({
                where: { Year: data.year }
            });
        } catch (error) {
            console.log(error);
            return null;
        }
    }


    //#endregion : Salary Sheet

    //#region : Users

    async getAllUsersDetails(): Promise<Users[]> {
        try {
            return await this.usersRepository.find();
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    async deActivateUser(email: string): Promise<boolean> {
        try {
            let data = await this.authenticationRepository.findOne({ where: { Email: email } });
            if (data == null) {
                return null;
            }
            data.Active = false;
            let res = await this.authenticationRepository.save(data);
            return res != null;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }

    //#endregion: Users

    //#region : Dashboard

    async showDashboardDailyTransactionReport(): Promise<object> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            // Fetch transactions for the current date
            const transactions = await this.transactionRepository.find({
                where: {
                    applicationTime: Between(today, tomorrow),
                },
            });
            // Reduce transactions to sum up amounts by transferType
            const result = transactions.reduce((acc, curr) => {
                const transferType = curr.transferType;
                const amount = curr.amount;

                if (!acc[transferType]) {
                    acc[transferType] = 0;
                }
                acc[transferType] += amount;
                return acc;
            }, {});
            // Return the result
            return result;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    //#endregion: Dashboard

    //#region: Save Login Session

    async saveLoginData(email: string, token: string): Promise<boolean> {
        try {
            const data = new LoginSessions();
            data.Email = email;
            data.Token = token;
            let cData = await this.loginSessionsRepository.save(data);
            return cData != null; //success
        } catch (error) {
            console.error('Error while Saving Login Data =>', error);
            return false;
        }
    }
    async checkValidLoginTokenData(email: string, token: string): Promise<boolean> {
        try {
            let data = await this.loginSessionsRepository.find({
                where: { Email: email, Token: token, deletedAt: IsNull() }
            });
            return data.length != 0;
        } catch (error) {
            console.error('Error while finding Login Data =>', error);
            return false;
        }
    }

    //#endregion: Save Login Session

    //#region : Logout
    async logoutAndDeleteSessionData(email: string, token: string): Promise<boolean> {
        try {
            let data = await this.loginSessionsRepository.find({
                where: { Email: email, Token: token, deletedAt: IsNull() }
            });
            data[0].deletedAt = new Date();
            let res = await this.loginSessionsRepository.save(data[0]);
            return res != null;
        } catch (error) {
            console.error('Error while Logout =>', error);
            return false;
        }
    }
    //#endregion : Logout
}
