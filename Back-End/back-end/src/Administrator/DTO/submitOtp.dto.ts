import { IsAlpha, IsDate, IsEmail, IsIn, IsNotEmpty, IsNumberString, Length, Matches } from "class-validator";
export class submitOtp{

    @IsNotEmpty()
    @IsEmail({}, { message: "Invalid Email format" }) 
    email: string;
    
    @IsNotEmpty({ message: 'OTP is required' })
    @IsNumberString(undefined, { message: 'OTP can contain only numbers' })
    otp: string;
}