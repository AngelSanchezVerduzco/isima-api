import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @Post('logout')
  async logout(@Body() body: { refresh_token: string }) {
    return this.authService.logout(body.refresh_token);
  }

  @Post('revoke-all')
  async revokeAllTokens(@Body() body: { usuario_id: number }) {
    return this.authService.revokeAllUserTokens(body.usuario_id);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() { correo }: ForgotPasswordDto) {
    return this.authService.forgotPassword(correo);
  }

  @Post('reset-password')
  async resetPassword(@Body() { token, nuevaContraseña }: ResetPasswordDto) {
    return this.authService.resetPassword(token, nuevaContraseña);
  }
}
