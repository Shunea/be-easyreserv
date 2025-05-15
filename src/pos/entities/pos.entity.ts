import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity, Index, JoinColumn, ManyToOne,
    OneToMany, OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PosType } from "@src/pos/enums/pos-type.enum";
import { User } from '@src/user/entities/user.entity';
import { Restaurant } from "@src/restaurant/entities/restaurant.entity";
@Entity()
export class Pos {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @CreateDateColumn({ name: 'created_at', nullable: false })
    public createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', nullable: false })
    public updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
    public deletedAt: Date;

    @Column({ name: 'title', type: 'text', nullable: false })
    public title: string;

    @Column('enum', {
        name: 'type',
        enum: PosType,
        default: PosType.MOBILE,
    })
    public posType: PosType;

    @Column({ name: 'is_active', default: true })
    public isActive: boolean;

    @Column({ name: 'installation_date', nullable: false })
    public installationDate: Date;

    @Column({ name: 'serial_number', nullable: false })
    public serialNumber: string;

    @Column({ name: 'provider', nullable: false })
    public provider: string;

    @Column({ name: 'version', nullable: false })
    public version: string;

    @Column({ name: 'last_maintenance_date', nullable: false })
    public lastMaintenanceDate: Date;

    @Column({ name: 'observations', nullable: true })
    public observations: string;

    @Column({ name: 'user', nullable: false })
    public user: string;

    @Index()
    @Column({ name: 'restaurant_id', nullable: true })
    public restaurantId: string;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.posDevices)
    @JoinColumn({ name: 'restaurant_id' })
    public restaurant: Restaurant;

    @Index()
    @Column({ name: 'place_id', nullable: true })
    public placeId: string;

}