import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto, LoginAuthAuthDto } from './dto/create-auth.dto';
import { getCurrentUser } from './common/decorators/getCurrentUser.decorator';
import { Public } from './common/decorators/public.decorator';
import { Response } from 'express';
import { Tokens } from './types/tokens.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/signup')
  async signup(
    @Body() createAuthDto: CreateAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Tokens> {
    const tokens = await this.authService.signup(createAuthDto);

    res.setHeader('set-cookie', [
      `a_token = ${tokens.access_token}; path = /; HttpOnly;`,
    ]);

    return tokens;
  }

  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginAuthDto: LoginAuthAuthDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Tokens> {
    const tokens = await this.authService.login(loginAuthDto);

    res.setHeader('set-cookie', [
      `a_token = ${tokens.access_token}; path = /; HttpOnly;`,
    ]);

    return tokens;
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @getCurrentUser('sub') userid: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log(userid);

    res.cookie('a_token', 'expired', {
      httpOnly: true,
      expires: new Date(0), // Set the expiration date to the past
      path: '/', // Specify the path to which the cookie belongs
      secure: true, // Make the cookie accessible only over HTTPS if needed
      sameSite: 'strict', // Enforce same-site cookie policy if needed
    });
  }

  @Get('currentUser')
  getUser(@getCurrentUser('sub') userId: string) {
    return this.authService.getUser(userId);
  }
}
