import { SignInDto, SignUpDto } from "../dto";
import { AuthResponseType } from "../types";
import { ResetPasswordDto, RequestPasswordResetDto } from "../dto";
import { RequestPasswordResetResponse, ResetPasswordResponse } from "../types";


export interface IAuthService {
    signIn(dto: SignInDto): Promise<AuthResponseType>;
    refreshTokens(refreshToken: string): Promise<AuthResponseType>;
}

export interface IRegistrationService {
    signUp(dto: SignUpDto): Promise<AuthResponseType>;
}

export interface IPasswordManagementService {
    requestPasswordReset(dto: RequestPasswordResetDto): Promise<RequestPasswordResetResponse>;
    resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponse>;
}
