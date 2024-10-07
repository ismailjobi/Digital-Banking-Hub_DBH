import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './adminAuthconstants';
import { AdminModule } from '../admin.module';
import { adminAuthService } from './adminAuth.service';
import { adminAuthController } from './adminAuth.controller';

@Module({
  imports: [
    AdminModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [adminAuthService],
  controllers: [adminAuthController],
  exports: [adminAuthService],
})
export class adminAuthModule {}