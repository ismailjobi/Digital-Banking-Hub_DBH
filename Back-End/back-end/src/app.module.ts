import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(
    { type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Tiger',
    database: 'DBH',
    autoLoadEntities: true,
    synchronize: true,
    } )],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
