import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity("ProductKeys")
export class ProductKeys {
    @PrimaryGeneratedColumn()
    Id: Number;
    @Column()
    Key: string;
}
