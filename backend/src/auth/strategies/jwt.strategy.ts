import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtService } from '../jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly jwtService: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        try {
          const payload = jwtService.verifyAccessToken(rawJwtToken);
          done(null, payload);
        } catch (error) {
          done(new UnauthorizedException('유효하지 않은 토큰입니다.'), null);
        }
      },
    });
  }

  async validate(payload: any) {
    return { id: payload.sub };
  }
}
