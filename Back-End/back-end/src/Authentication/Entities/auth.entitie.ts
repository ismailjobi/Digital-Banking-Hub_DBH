import { Entity, Column, PrimaryColumn, Generated, ManyToMany, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { Role } from 'src/Administrator/Entities/Role.entity';
import { SalarySheet } from 'src/Administrator/Entities/SalarySheet.entity';
import { Users } from 'src/CommonEntities/Users.entity';
import { AttendanceReports } from 'src/Administrator/Entities/AttendanceReports.entity';


@Entity("Authentication")
export class Authentication{

    @PrimaryColumn({name:'Email', type: 'varchar', length: 100}) 
    Email: string;
    @Column({ type: 'varchar' })
    Password: string;
    @Column({name:"RoleID"})
    RoleID: string;
    @Column({ default: false })
    Active: boolean;
    @ManyToOne(()=>Role, Role=>Role.Authentications, { onDelete: 'CASCADE', onUpdate: 'CASCADE' } )
    @JoinColumn({name:"RoleID"})
    Role:Role
    @OneToOne(()=>Users, Users=>Users.Authentication )
    User:Users
    @OneToMany(()=>AttendanceReports, AttendanceReports=>AttendanceReports.Authentication)
    AttendanceReports:AttendanceReports[];
    @OneToMany(()=>SalarySheet, SalarySheet=>SalarySheet.Authentication)
    SalarySheet:SalarySheet[];
    
}