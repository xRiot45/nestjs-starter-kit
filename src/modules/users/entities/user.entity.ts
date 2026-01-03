import { UserStatus } from 'src/common/enums/user-status.enum';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 50 })
    username: string;

    @Column({ name: 'fullName', length: 100 })
    fullName: string;

    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ name: 'password', type: 'text' })
    password: string;

    @Column({ name: 'avatarUrl', type: 'text', nullable: true })
    avatarUrl: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({
        name: 'emailVerifiedAt',
        type: 'timestamp',
        nullable: true,
    })
    emailVerifiedAt: Date | null;

    @Column({
        name: 'isVerified',
        type: 'boolean',
        nullable: false,
        default: false,
    })
    isVerified: boolean;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.OFFLINE,
    })
    status: UserStatus;

    @Column({ name: 'currentRefreshToken', type: 'text', nullable: true })
    currentRefreshToken: string | null;

    @Column({ name: 'lastSeenAt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastSeenAt: Date;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;

    // --- Relations ---

    // @OneToMany(() => ConversationMember, member => member.user)
    // memberships: ConversationMember[];

    // @OneToMany(() => Message, message => message.sender)
    // messages: Message[];

    // @OneToMany(() => Story, story => story.user)
    // stories: Story[];
}
