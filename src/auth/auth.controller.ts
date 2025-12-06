import { Controller, Get, Query, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  async googleAuth(@Res() res: Response) {
    try {
      const googleAuthUrl = this.authService.getGoogleAuthUrl();
      
      // Option 1: Redirect (302)
      return res.redirect(googleAuthUrl);
      
      // Option 2: Return JSON with URL (uncomment to use this instead)
      // return res.status(HttpStatus.OK).json({
      //   google_auth_url: googleAuthUrl,
      // });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to generate Google auth URL',
        error: error.message,
      });
    }
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException('Authorization code is missing');
    }

    try {
      const user = await this.authService.handleGoogleCallback(code);

      return res.status(HttpStatus.OK).json({
        user_id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        message: error.message || 'Failed to authenticate with Google',
      });
    }
  }
}