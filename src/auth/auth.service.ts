import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateGoogleUser(profile: any): Promise<User> {
    const { id, emails, displayName, photos } = profile;
    
    let user = await this.userRepository.findOne({ where: { googleId: id } });
    
    if (!user) {
      user = await this.userRepository.findOne({ where: { email: emails[0].value } });
      
      if (user) {
        user.googleId = id;
        await this.userRepository.save(user);
      } else {
        user = this.userRepository.create({
          googleId: id,
          email: emails[0].value,
          name: displayName,
          picture: photos?.[0]?.value,
          emailVerified: emails[0].verified,
        });
        await this.userRepository.save(user);
      }
    }
    
    return user;
  }

  async generateJwt(user: User): Promise<string> {
    const payload = { 
      sub: user.id, 
      email: user.email,
      name: user.name 
    };
    
    return this.jwtService.sign(payload);
  }

  async validateUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}