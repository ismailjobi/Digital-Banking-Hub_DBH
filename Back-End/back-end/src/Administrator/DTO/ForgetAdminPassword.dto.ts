import { IsEmail, IsIn, IsNotEmpty, IsNumberString, Length, Matches } from "class-validator";
export class ForgetAdminPassword{
    
    @IsNotEmpty()
    @IsEmail({}, { message: "Invalid email format" }) 
    Email: string;

    @IsNotEmpty()
    @Length(6, undefined, { message: "New Password must be at least 6 characters long" }) 
    @Matches(/^(?=.*[A-Z])/,{ message: "New Password must contain at least one uppercase character" }) 
    NewPassword: string;

    @IsNotEmpty({ message: 'OTP is required' })
    @IsNumberString(undefined, { message: 'OTP can contain only numbers' })
    otp: string;
}