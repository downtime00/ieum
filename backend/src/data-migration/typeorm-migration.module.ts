import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'ieum',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../data-migration/*{.ts,.js}'],
        migrationRunInTransaction: true,
        synchronize: false,
      }),
    }),
  ],
})
export class TypeORMMigrationModule {}