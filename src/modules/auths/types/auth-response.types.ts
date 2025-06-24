import { UserResponseDto } from "src/modules/users/types";

export class AuthResponseType {
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
}
