import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SocialAuthProvider, SNSUserInfo } from '../interfaces/social-auth-provider.interface';

@Injectable()
export class NaverAuthProvider implements SocialAuthProvider {
  name = 'NAVER';
  private readonly clientId = process.env.NAVER_CLIENT_ID;
  private readonly redirectUri = process.env.NAVER_REDIRECT_URI;
  private readonly clientSecret = process.env.NAVER_CLIENT_SECRET;

  async getAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: state,
    });
    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const response = await axios.post('https://nid.naver.com/oauth2.0/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code,
    });
    return response.data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<SNSUserInfo> {
    const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      provider: 'NAVER',
      providerUserId: response.data.response.id,
      email: response.data.response.email,
      name: response.data.response.name,
      profileImage: response.data.response.profile_image,
    };
  }
}
