import { AccountEntity } from "./Account.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("Services")
export class ServiceEntity{

    @PrimaryGeneratedColumn()
    serviceId: number;

    @Column({ name: 'ServiceType', type: 'varchar', length: 50 })
    name: string;

    @Column({ name: 'Document' })
    filename: string;

    @Column({ name: 'Status', default: false }) 
    status: boolean;

    @CreateDateColumn({ name: 'ApplicationTime' })
    applicationTime: Date;

    @ManyToOne(() => AccountEntity, account => account.services)
    @JoinColumn({ name: 'AccountNumber' })
    account: AccountEntity;
}