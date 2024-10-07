import { IsAlpha, IsDate, IsDateString, IsEmail, IsISO8601, IsIn, IsNotEmpty, IsNumberString, Length, Matches, isISO8601 } from "class-validator";
export class UpdateAdminEmail{
    
    @IsNotEmpty()
    @IsEmail({}, { message: "Invalid email format" }) 
    NewEmail: string;
}