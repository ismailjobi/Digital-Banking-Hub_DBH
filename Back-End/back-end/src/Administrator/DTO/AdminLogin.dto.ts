import { IsEmail, IsNotEmpty, Length, Matches } from "class-validator";

export class adminLogin {

    @IsNotEmpty()
    @IsEmail({}, { message: "Invalid email format" })
    Email: string;

    @IsNotEmpty()
    @Length(6, undefined, { message: "Password must be at least 6 characters long" })
    @Matches(/^(?=.*[A-Z])/, { message: "Password must contain at least one uppercase character" })
    Password: string;
}