import { Authentication } from 'src/Authentication/Entities/auth.entitie';
import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, PrimaryColumn, Generated, OneToMany, OneToOne, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';

@Entity("SalarySheet")
export class SalarySheet {
    @PrimaryGeneratedColumn()
    Id: Number;
    @Column()
    Year: Number;
    @Column({name:"Email"})
    Email: string;
    @Column({ default: 0 })
    Jan: Number;
    @Column({ default: 0 })
    Feb: Number;
    @Column({ default: 0 })
    Mar: Number;
    @Column({ default: 0 })
    Apr: Number;
    @Column({ default: 0 })
    May: Number;
    @Column({ default: 0 })
    Jun: Number;
    @Column({ default: 0 })
    Jul: Number;
    @Column({ default: 0 })
    Aug: Number;
    @Column({ default: 0 })
    Sep: Number;
    @Column({ default: 0 })
    Oct: Number;
    @Column({ default: 0 })
    Nov: Number;
    @Column({ default: 0 })
    Dec: Number;

    @ManyToOne(() => Authentication, Authentication => Authentication.SalarySheet, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({name:"Email"})
    Authentication: Authentication;
}
