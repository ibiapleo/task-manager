import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_HAS_DIGIT,
  PASSWORD_HAS_LOWERCASE,
  PASSWORD_HAS_SPECIAL,
  PASSWORD_HAS_UPPERCASE,
  PASSWORD_MIN_LENGTH,
} from '@task-manager/shared-types';

export class RegisterDto {
  @ApiProperty({
    description: 'Account e-mail address.',
    example: 'voce@suaequipe.com',
  })
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'Informe seu e-mail.' })
  email: string;

  @ApiProperty({
    description:
      'Password meeting OWASP-aligned complexity (min 8, upper, lower, digit, special).',
    example: 'Senha@Forte1',
    minLength: PASSWORD_MIN_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: 'Informe uma senha.' })
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  })
  @MaxLength(128, { message: 'A senha deve ter no máximo 128 caracteres.' })
  @Matches(PASSWORD_HAS_LOWERCASE, {
    message: 'A senha deve conter ao menos uma letra minúscula.',
  })
  @Matches(PASSWORD_HAS_UPPERCASE, {
    message: 'A senha deve conter ao menos uma letra maiúscula.',
  })
  @Matches(PASSWORD_HAS_DIGIT, {
    message: 'A senha deve conter ao menos um número.',
  })
  @Matches(PASSWORD_HAS_SPECIAL, {
    message: 'A senha deve conter ao menos um caractere especial.',
  })
  password: string;
}
