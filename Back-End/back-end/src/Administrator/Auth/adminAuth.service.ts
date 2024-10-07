import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../admin.service';
import * as bcrypt from 'bcrypt';
import { adminLogin } from '../DTO/AdminLogin.dto';

@Injectable()
export class adminAuthService {
    constructor(
        private adminService: AdminService,
        private jwtService: JwtService
    ) { }

    async logIn(loginData: adminLogin): Promise<string> {
        try {
            const adminData = await this.adminService.findVerifiedAdminByEmailForAuth(loginData.Email);
            if (adminData == null) {
                return null;
            }
            const isMatch = await bcrypt.compare(loginData.Password, adminData.Password);
            if (!isMatch) {
                return null;
            }
            const payload = {
                email:adminData.Email,
                role:adminData.RoleID
            }
            return await this.jwtService.signAsync(payload);
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    async saveLoginSession(email:string, token:string): Promise<boolean> {
        return await this.adminService.saveLoginData(email,token);
    }
    async checkValidLoginToken(email:string, token:string): Promise<boolean> {
        return await this.adminService.checkValidLoginTokenData(email,token);
    }
}