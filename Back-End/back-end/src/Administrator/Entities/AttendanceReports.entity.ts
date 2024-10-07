
import { Authentication } from 'src/Authentication/Entities/auth.entitie';
import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, PrimaryColumn, Generated, OneToMany, OneToOne, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';

@Entity("AttendanceReports")
export class AttendanceReports {
    @PrimaryGeneratedColumn()
    Id: Number;
    @Column()
    Year: Number;
    @Column({name:"Email"})
    Email: string;
    @Column()
    Jan: Number;
    @Column()
    Feb: Number;
    @Column()
    Mar: Number;
    @Column()
    Apr: Number;
    @Column()
    May: Number;
    @Column()
    Jun: Number;
    @Column()
    Jul: Number;
    @Column()
    Aug: Number;
    @Column()
    Sep: Number;
    @Column()
    Oct: Number;
    @Column()
    Nov: Number;
    @Column()
    Dec: Number;

    @ManyToOne(() => Authentication, Authentication => Authentication.AttendanceReports, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({name:"Email"})
    Authentication: Authentication;
}
