import { Controller, Get, Req, Res, Query, Redirect, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const user = req.user;
      const token = await this.authService.generateJwt(user);
      
      // OPTION A: Return JSON directly (for API testing)
      return res.json({
        success: true,
        message: "Google authentication successful",
        token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        }
      });
      
  
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authentication failed",
        error: error.message
      });
    }
  }

  @Get('google/url')
  getGoogleAuthUrl() {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const redirectUri = encodeURIComponent(
      `${this.configService.get('FRONTEND_URL') || 'http://localhost:4000'}/auth/google/callback`
    );
    const scope = encodeURIComponent('profile email');
    
    if (!clientId) {
      throw new Error('Google Client ID is not configured');
    }
    
    return {
      google_auth_url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`,
    };
  }

  // Simple test endpoint to get token without Google
  @Get('test/token')
  async getTestToken(@Query('email') email?: string, @Query('name') name?: string) {
    const userEmail = email || 'test@example.com';
    const userName = name || 'Test User';
    
    // Create or get a test user
    let user = await this.authService['userRepository'].findOne({ 
      where: { email: userEmail } 
    });
    
    if (!user) {
      user = this.authService['userRepository'].create({
        googleId: `test_${Date.now()}`,
        email: userEmail,
        name: userName,
        emailVerified: true,
      });
      await this.authService['userRepository'].save(user);
    }
    
    const token = await this.authService.generateJwt(user);
    
    return {
      message: "Test token generated",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    };
  }
}