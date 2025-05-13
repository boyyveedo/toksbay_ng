import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { CreateSocialUserDto } from 'src/modules/auth /dto';
import { UserStatus } from '@prisma/client';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository {
    constructor(private prisma: PrismaService) { }

    async createUser(dto: CreateUserDto): Promise<User> {
        return this.prisma.user.create({
            data: dto,
        });
    }

    async createSocialUser(dto: CreateSocialUserDto): Promise<User> {
        const existingUser = await this.findUserByEmail(dto.email);
        if (existingUser) {
            return existingUser;
        }

        const socialUser = await this.findSocialUser(dto.providerId, dto.provider);
        if (socialUser) {
            return socialUser;
        }

        const data: any = {
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            providerId: dto.providerId,
            provider: dto.provider,
            isVerified: dto.isEmailVerified,
        };

        return this.prisma.user.create({
            data,
        });
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: {
                email,
                deletedAt: null,
            },
        });
    }

    async findUserById(id: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
    }
    async updateUser(id: string, data: UpdateUserDto): Promise<Omit<User, 'password'>> {
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { ...data },
        });

        const { password, ...userWithoutPassword } = updatedUser;

        return userWithoutPassword;
    }



    async deleteUser(id: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async findAllUsers(limit: number, skip: number): Promise<User[]> {
        return this.prisma.user.findMany({
            where: { deletedAt: null },
            take: limit,
            skip: skip,
        });
    }

    async findSocialUser(providerId: string, provider: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: {
                providerId_provider: {
                    providerId,
                    provider,
                },
            },
        });
    }

    async banUser(id: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { status: 'BANNED' },
        });
    }
}
