import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
    constructor(private prisma: PrismaService, private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const productId = request.params.id;

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new ForbiddenException('Product not found');

        if (user.role !== 'ADMIN' && product.sellerId !== user.id) {
            throw new ForbiddenException('Access denied');
        }

        return true;
    }
}
