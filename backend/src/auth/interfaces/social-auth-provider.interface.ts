export interface SNSUserInfo {
  provider: string;
  providerUserId: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

export interface SocialAuthProvider {
  name: string;
  getAuthUrl(state: string): Promise<string>;
  getAccessToken(code: string): Promise<string>;
  getUserInfo(accessToken: string): Promise<SNSUserInfo>;
}
