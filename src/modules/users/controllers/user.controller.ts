import {
    Controller, Post, Body, Get, Param, Put, Delete, UseGuards, Query, Patch
  } from '@nestjs/common';
  import { UsersService } from '../services/users.services';
  import { CreateUserDto, UpdateUserDto, CreateAdminDto } from '../dto';
  import { User } from '@prisma/client';
  import { JwtAuthGuard, VerifiedUserGuard } from 'src/common/guards';
  import { GetUser } from 'src/common/decorators';
  import { RolesGuard } from 'src/common/guards';
  import { Roles } from 'src/common/decorators';
  import { Role } from '@prisma/client';
  import { UserResponseDto } from '../types';
  import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';  
  
  @ApiTags('Users')  
  @Controller('api/v1/users')
  export class UserController {
    constructor(private readonly userService: UsersService) {}
  
    @UseGuards(JwtAuthGuard, VerifiedUserGuard)
    @Get('me/email')
    @ApiOperation({ summary: 'Get My Email' })
    @ApiResponse({ status: 200, description: 'User email fetched successfully.', type: UserResponseDto })
    async getMyEmail(@GetUser('email') email: string): Promise<UserResponseDto | null> {
      return this.userService.findUserByEmail(email);
    }
  
    @UseGuards(JwtAuthGuard, VerifiedUserGuard)
    @Get('me')
    @ApiOperation({ summary: 'Get My Profile' })
    @ApiResponse({ status: 200, description: 'User profile fetched successfully.', type: UserResponseDto })
    async getMyProfile(@GetUser('id') id: string): Promise<UserResponseDto | null> {
      return this.userService.findUserById(id);
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    @ApiOperation({ summary: 'Get All Users' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of users' })
    @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Skip number of users' })
    @ApiResponse({ status: 200, description: 'List of users', type: [UserResponseDto] })
    async getAllUsers(
      @Query('limit') limit = 50,
      @Query('skip') skip = 0,
    ) {
      return this.userService.findAllUsers(Number(limit), Number(skip));
    }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put(':id')
    @ApiOperation({ summary: 'Update User Information' })
    @ApiResponse({ status: 200, description: 'User updated successfully.', type: UserResponseDto })
    @ApiParam({ name: 'id', type: String, description: 'User ID' })
    @ApiBody({ type: UpdateUserDto })  
    async updateUser(
      @Param('id') id: string,
      @Body() updateUserDto: UpdateUserDto,
      @GetUser() currentUser: User
    ): Promise<Omit<UserResponseDto, 'password'>> {
      return this.userService.updateUser(id, updateUserDto, currentUser);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id/promote')
    @Roles(Role.ADMIN)
    @ApiResponse({ status: 200, description: 'User promoted successfully.', type: UserResponseDto })
    @ApiParam({ name: 'id', type: String, description: 'User ID' })
    @ApiOperation({ 
      summary: 'Promote user to moderator (Admin only)',
      description: 'Allows admin to promote a regular user to moderator role'
    })
    @ApiBody({ type: UpdateUserDto })  
    
    async promoteToModerator(
      @Param('id') userId: string,
      @GetUser() admin: User
    ) {
      return this.userService.promoteToModerator(userId, admin);
    }
  


  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete User' })
    @ApiResponse({ status: 200, description: 'User deleted successfully.' })
    @ApiParam({ name: 'id', type: String, description: 'User ID' })
    async deleteUser(@Param('id') id: string) {
      return this.userService.deleteUser(id);
    }

  @Roles(Role.ADMIN)
  @Post('create-admin')
  @ApiOperation({ summary: 'Create Admin User' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({ status: 201, description: 'Admin user created successfully.', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid admin secret key.' })
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto
  ): Promise<UserResponseDto> {
    return this.userService.createAdminUser(createAdminDto);
  }
  
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/ban')
    @ApiOperation({ summary: 'Ban User' })
    @ApiResponse({ status: 200, description: 'User banned successfully.' })
    @ApiParam({ name: 'id', type: String, description: 'User ID' })
    @ApiBody({ type: UpdateUserDto })  
    async ban(@Param('id') id: string) {
      return this.userService.banUser(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  async unbanUser(@Param('id') id: string) {
    return this.userService.unbanUser(id);
  }
  }
  