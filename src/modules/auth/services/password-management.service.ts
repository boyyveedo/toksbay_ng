import { Injectable, Logger } from '@nestjs/common';
import { RequestPasswordResetDto, ResetPasswordDto } from '../dto';
import { RequestPasswordResetResponse, ResetPasswordResponse } from '../types';
import { PasswordResetService } from './password-reset.service';
import { IPasswordManagementService } from '../interface';
@Injectable()
export class PasswordManagementService implements IPasswordManagementService {
    private readonly logger = new Logger(PasswordManagementService.name);

    constructor(
        private passwordResetService: PasswordResetService,
    ) { }

    async requestPasswordReset(dto: RequestPasswordResetDto): Promise<RequestPasswordResetResponse> {
        this.logger.log('Processing password reset request');
        return this.passwordResetService.requestPasswordReset(dto);
    }

    async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
        this.logger.log('Processing password reset');
        return this.passwordResetService.resetPassword(dto);
    }
}