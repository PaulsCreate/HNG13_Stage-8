import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { GoogleUserDto } from '../auth/dto/google-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createFromGoogle(googleUser: GoogleUserDto): Promise<User> {
    const user = this.userRepository.create({
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      googleId: googleUser.googleId,
    });

    return this.userRepository.save(user);
  }

  async updateFromGoogle(user: User, googleUser: GoogleUserDto): Promise<User> {
    user.name = googleUser.name;
    user.picture = googleUser.picture;
    return this.userRepository.save(user);
  }
}