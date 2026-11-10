import { IsString, IsInt, IsPositive } from 'class-validator';

export class CreateAudioPlayerDto {
  @IsString()
  name: string; // 파일명

  @IsInt()
  @IsPositive()
  size: number; // 파일 크기 (바이트)
}

export class UpdateAudioPlayerDto {
  @IsString()
  name?: string;

  @IsInt()
  @IsPositive()
  size?: number;

  isPlaying?: boolean;
}