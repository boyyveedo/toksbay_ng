import { Controller, Get } from '@nestjs/common';

@Controller()
export class UserController {

    @Get()
    getHello(): string {
        return 'Hello World!';
    }
}
