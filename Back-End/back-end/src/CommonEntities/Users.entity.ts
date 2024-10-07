import { randomBytes } from 'crypto';
import { Authentication } from 'src/Authentication/Entities/auth.entitie';
import { AccountEntity } from 'src/Employees/Entities/Account.entity';
import { TransactionEntity } from 'src/Employees/Entities/transaction.entity';

import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, PrimaryColumn, Generated, OneToMany, OneToOne, JoinColumn } from 'typeorm';

@Entity("Users")
export class Users {
    @PrimaryColumn()
    userId: string;
    @Column()
    FullName: string;
    @Column({name:"Email"})
    Email: string;
    @Column()
    Gender: string;
    @Column({type: 'date'})
    DOB: Date;
    @Column()
    NID:string
    @Column()
    Phone:string
    @Column()
    Address:string
    @Column()
    FileName:string //PictureName

    @OneToOne(() => Authentication, Authentication => Authentication.User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({name:"Email"})
    Authentication: Authentication;
    @OneToMany(() => AccountEntity, Accounts => Accounts.userId, { cascade: true, onDelete: 'CASCADE' })
    Accounts: AccountEntity[];
    @OneToMany(() => TransactionEntity, Transactions => Transactions.userId)
    Transactions: TransactionEntity[];

    @BeforeInsert()
    generateID() {
        const randomBytesBuffer = randomBytes(4);
        this.userId = "U-" + parseInt(randomBytesBuffer.toString('hex'), 16) % 1000000; //6 digit -> 10e6
    }
    
    //used manually
    generateId(): string {
        // Custom logic to generate a 6-digit number
        const randomNumber = Math.floor(100000 + Math.random() * 900000).toString();
        this.userId = 'E-' + randomNumber;
        return this.userId;
    }
    
    //used manually
    generateUserId(): string {
        // Custom logic to generate a 6-digit number
        const randomNumber = Math.floor(100000 + Math.random() * 900000).toString();
        this.userId = 'U-' + randomNumber;
        return this.userId;
    }
}
