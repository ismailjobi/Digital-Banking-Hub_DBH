import { IsAlpha, IsDate, IsEmail, IsIn, IsNotEmpty, IsNumberString, Length, Matches } from "class-validator";
export class salarySheetGen{

    @IsNotEmpty()
    @IsIn(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], { message: 'Invalid month' })
    month: string;

    @IsNotEmpty({ message: 'year is required' })
    @IsNumberString(undefined, { message: 'year can contain only numbers' })
    year: number;
}