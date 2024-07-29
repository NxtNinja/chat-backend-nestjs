import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAuthDto, LoginAuthAuthDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  comparePasswords,
  // compareRefreshTokens,
  hashPassword,
} from 'src/utils/bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types/tokens.type';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getTokens(userid: string, email: string): Promise<Tokens> {
    const [access_token] = await Promise.all([
      //for access token
      this.jwtService.signAsync(
        {
          sub: userid,
          email,
        },
        {
          secret: 'access_secret@1234',
          expiresIn: 60 * 15,
        },
      ),
    ]);

    return {
      access_token: access_token,
    };
  }

  async signup(createAuthDto: CreateAuthDto): Promise<Tokens> {
    const hash = await hashPassword(createAuthDto.password); // hash password
    //create user
    const newuser = await this.prisma.user.create({
      data: {
        ...createAuthDto,
        password: hash,
      },
    });

    //generate tokens
    const tokens = await this.getTokens(newuser.id, newuser.email);

    //return tokens as the function returns a Promise of type Tokens
    return tokens;
  }

  async login(loginAuthDto: LoginAuthAuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginAuthDto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('User does not exists');
    }

    const matchPasswords = await comparePasswords(
      loginAuthDto.password,
      user.password,
    );

    if (!matchPasswords) {
      throw new ForbiddenException('Invalid user credentials');
    }

    //generate tokens
    const tokens = await this.getTokens(user.id, user.email);

    //return tokens as the function returns a Promise of type Tokens
    return tokens;
  }

  async getUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        return new NotFoundException('User not Found');
      }

      return {
        status: 200,
        message: 'OK',
        data: { id: user.id, name: user.username, email: user.email },
      };
    } catch (error) {
      return new InternalServerErrorException('Internal Server Error');
    }
  }
}
