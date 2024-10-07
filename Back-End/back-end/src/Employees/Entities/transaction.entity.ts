import { Users } from "src/CommonEntities/Users.entity";
import {  BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from "typeorm";

@Entity("Transaction")
export class TransactionEntity{

    @PrimaryColumn({type: "varchar"})
    transactionId: string;
    @Column({name:'AccountNumber'})
    acountNumber: number;
    @Column({name:'Amount'})
    amount: number;
    @Column({name:'ReceiverAccount'})
    receiverAccount: number ;
    @Column({name:'AccountHolderName',length: 100,type: "varchar"})
    holderName: string;
    @Column({name:'AccountType',length: 100,type: "varchar"})
    accountType: string;
    @Column({name:'BankCode'})
    bankCode: number;
    @Column({name:'RoutingNumber'})
    routingNumber: number;
    @Column({name:'TransferType',length: 20,type: "varchar"})
    transferType: string;
    @Column({name:'Status',default:true}) 
    transactionStatus: boolean;
    @CreateDateColumn({ name: 'TransactionTime' })
    applicationTime: Date;
    
    @BeforeInsert()
    generateId():string {
    // Custom logic to generate a 5-digit number
       const randomNumber = Math.floor(10000 + Math.random() * 90000).toString();
       this.transactionId = 'T-' + randomNumber;
       return this.transactionId;
    }
    @ManyToOne(() => Users, Users => Users.Transactions)
    @JoinColumn({name:'User_ID'})
    userId: Users;
}
