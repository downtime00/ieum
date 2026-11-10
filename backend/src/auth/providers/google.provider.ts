import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SocialAuthProvider, SNSUserInfo } from '../interfaces/social-auth-provider.interface';

@Injectable()
export class GoogleAuthProvider implements SocialAuthProvider {
  name = 'GOOGLE';
  private readonly clientId = process.env.GOOGLE_CLIENT_ID;
  private readonly redirectUri = process.env.GOOGLE_REDIRECT_URI;
  private readonly clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  async getAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: state,
      access_type: 'offline',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code,
    });
    return response.data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<SNSUserInfo> {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      provider: 'GOOGLE',
      providerUserId: response.data.id,
      email: response.data.email,
      name: response.data.name,
      profileImage: response.data.picture,
    };
  }
}
