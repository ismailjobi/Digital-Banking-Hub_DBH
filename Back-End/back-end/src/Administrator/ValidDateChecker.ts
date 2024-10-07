import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidDate(validationOptions?: ValidationOptions) {
    return function(object: Object, propertyName: string) {
        registerDecorator({
            name: 'isValidDate',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    // Check if value matches the format DD-MM-YYYY
                    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                    if (!value.match(dateRegex)) {
                        return false;
                    }

                    // Convert value to a Date object
                    const [_, day, month, year] = value.match(dateRegex);
                    const date = new Date(`${year}-${month}-${day}`);

                    // Check if the date is valid
                    return !isNaN(date.getTime());
                }
            }
        });
    };
}