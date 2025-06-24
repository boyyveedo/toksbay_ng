import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenService } from '../src/modules/auths/services';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    tokenService = moduleFixture.get<TokenService>(TokenService);
    await app.init();

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'Test',
        lastName: 'User',
        role: Role.CUSTOMER,
        isVerified: true,
      },
    });
    userId = user.id;
    userToken = (await tokenService.generateTokens(
      user.id,
      user.email,
      user.isVerified,
      user.role,
    )).accessToken;

    // Create an admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpassword', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        isVerified: true,
      },
    });
    adminId = admin.id;
    adminToken = (await tokenService.generateTokens(
      admin.id,
      admin.email,
      admin.isVerified,
      admin.role,
    )).accessToken;
  }); // Added closing brace for beforeAll

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { in: ['test@example.com', 'admin@example.com', 'newadmin@example.com'] } },
    });
    await app.close();
  });

  describe('/api/v1/users/me/email (GET)', () => {
    it('should get user email', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me/email')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toEqual('test@example.com');
        });
    });
  });

  describe('/api/v1/users/me (GET)', () => {
    it('should get user profile', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(userId);
          expect(res.body.email).toEqual('test@example.com');
          expect(res.body.role).toEqual(Role.CUSTOMER);
        });
    });
  });

  describe('/api/v1/users (GET)', () => {
    it('should get all users (admin only)', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?limit=10&skip=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should fail for non-admin', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?limit=10&skip=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/api/v1/users/:id (PUT)', () => {
    it('should update user information', async () => {
      const updateDto = { firstName: 'Updated Name' };
      return request(app.getHttpServer())
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toEqual('Updated Name');
        });
    });
  });

  describe('/api/v1/users/:id/promote (PATCH)', () => {
    it('should promote user to moderator (admin only)', async () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}/promote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toEqual(Role.MODERATOR);
        });
    });

    it('should fail for non-admin', async () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}/promote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/api/v1/users/:id/ban (PATCH)', () => {
    it('should ban user (admin only)', async () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail for non-admin', async () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}/ban`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/api/v1/users/:id/unban (PATCH)', () => {
    it('should unban user (admin only)', async () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}/unban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail for non-admin', async () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${userId}/unban`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/api/v1/users/create-admin (POST)', () => {
    it('should create admin user (admin only)', async () => {
      const createAdminDto = {
        email: 'newadmin@example.com',
        password: 'newadminpassword',
        firstName: 'New',
        lastName: 'Admin',
        secretKey: process.env.ADMIN_SECRET_KEY 
      };
      return request(app.getHttpServer())
        .post('/api/v1/users/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createAdminDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toEqual('newadmin@example.com');
          expect(res.body.role).toEqual(Role.ADMIN);
        });
    });

    it('should fail for non-admin', async () => {
      const createAdminDto = {
        email: 'newadmin2@example.com',
        password: 'newadminpassword',
        firstName: 'New',
        lastName: 'Admin',
        secretKey: process.env.ADMIN_SECRET_KEY || 'your-secret-key',
      };
      return request(app.getHttpServer())
        .post('/api/v1/users/create-admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('/api/v1/users/:id (DELETE)', () => {
    it('should delete user (admin only)', async () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail for non-admin', async () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
}); // Closing brace for describe