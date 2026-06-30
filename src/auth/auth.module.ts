import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionService } from '../common/session.service';
import { UserEntity } from '../users';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [AuthResolver, AuthService, SessionService],
  exports: [AuthService],
})
export class AuthModule {}
