import {
    Controller, Post, Body, Get, Param, Put, Delete, UseGuards, Query, Patch
} from '@nestjs/common';
import { UserService } from '../services/users.services';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { User } from '@prisma/client';
import { JwtAuthGuard, VerifiedUserGuard } from 'src/common/guards';
import { GetUser } from 'src/common/decorators';
import { RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { Role } from '@prisma/client';
import { UserResponseDto } from '../types';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }


    // @Post()
    // async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    //     return this.userService.createUser(createUserDto);
    // }
    @UseGuards(JwtAuthGuard, VerifiedUserGuard)
    @Get('me/email')
    getMyEmail(@GetUser('email') email: string): Promise<UserResponseDto | null> {
        return this.userService.findUserByEmail(email);
    }


    @UseGuards(JwtAuthGuard, VerifiedUserGuard)
    @Get('me')
    getMyProfile(@GetUser('id') id: string): Promise<UserResponseDto | null> {
        return this.userService.findUserById(id);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async getAllUsers(
        @Query('limit') limit = 50,
        @Query('skip') skip = 0,
    ) {
        return this.userService.findAllUsers(Number(limit), Number(skip));
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id')
    async updateUser(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @GetUser() currentUser: User
    ): Promise<Omit<UserResponseDto, 'password'>> {
        return this.userService.updateUser(id, updateUserDto, currentUser);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    deleteUser(@Param('id') id: string) {
        return this.userService.deleteUser(id);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id')
    ban(@Param('id') id: string) {
        return this.userService.banUser(id);
    }

}
