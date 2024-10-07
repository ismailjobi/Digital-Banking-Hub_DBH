import { IsEmail, IsIn, IsNotEmpty, IsNumberString, Length, Matches } from "class-validator";
export class AllocateSalary{
    
    @IsNotEmpty({ message: "Role is required" })
    @Matches(/^[A-Za-z]+$/, { message: 'RoleName must contain only English alphabets' })
    RoleName: string;

    @IsNotEmpty({ message: 'Salary is required' })
    @IsNumberString(undefined, { message: 'Salary can contain only numbers' })
    Salary: number;
}