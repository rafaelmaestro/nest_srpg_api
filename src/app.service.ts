import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
    getHello(): object {
        return {
            Message: 'Hello, world!',
            Date: new Date(),
        }
    }
}
