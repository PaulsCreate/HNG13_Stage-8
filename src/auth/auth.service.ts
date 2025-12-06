import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { GoogleUserDto } from './dto/google-user.dto';

@Injectable()
export class AuthService {
  private readonly googleTokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly googleUserInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  getGoogleAuthUrl(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    const scope = 'openid email profile';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string): Promise<User> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(this.googleTokenUrl, {
        code,
        client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        redirect_uri: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
        grant_type: 'authorization_code',
      });

      const { access_token } = tokenResponse.data;

      // Get user info from Google
      const userInfoResponse = await axios.get(this.googleUserInfoUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const { id, email, name, picture } = userInfoResponse.data;

      const googleUser: GoogleUserDto = {
        googleId: id,
        email,
        name,
        picture,
      };

      // Check if user exists
      let user = await this.usersService.findByGoogleId(googleUser.googleId);

      if (user) {
        // Update existing user
        user = await this.usersService.updateFromGoogle(user, googleUser);
      } else {
        // Create new user
        user = await this.usersService.createFromGoogle(googleUser);
      }

      return user;
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        throw new UnauthorizedException('Invalid authorization code');
      }
      throw new InternalServerErrorException('Failed to authenticate with Google');
    }
  }
}