import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SocialAuthProvider, SNSUserInfo } from '../interfaces/social-auth-provider.interface';

@Injectable()
export class KakaoAuthProvider implements SocialAuthProvider {
  name = 'KAKAO';
  private readonly clientId = process.env.KAKAO_CLIENT_ID;
  private readonly redirectUri = process.env.KAKAO_REDIRECT_URI;
  private readonly clientSecret = process.env.KAKAO_CLIENT_SECRET;

  async getAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: state,
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const response = await axios.post('https://kauth.kakao.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code,
    });
    return response.data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<SNSUserInfo> {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      provider: 'KAKAO',
      providerUserId: response.data.id.toString(),
      email: response.data.kakao_account?.email,
      name: response.data.kakao_account?.profile?.nickname,
      profileImage: response.data.kakao_account?.profile?.profile_image_url,
    };
  }
}
