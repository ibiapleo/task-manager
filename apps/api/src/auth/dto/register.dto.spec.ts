import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  async function errorsFor(password: string) {
    const dto = plainToInstance(RegisterDto, {
      email: 'voce@suaequipe.com',
      password,
    });
    return validate(dto);
  }

  it('accepts a strong password', async () => {
    const errors = await errorsFor('Senha@Forte1');
    expect(errors).toHaveLength(0);
  });

  it('rejects a short / weak password', async () => {
    const errors = await errorsFor('abc');
    expect(errors.length).toBeGreaterThan(0);
    const passwordError = errors.find((e) => e.property === 'password');
    expect(passwordError).toBeDefined();
  });

  it('rejects password missing special character', async () => {
    const errors = await errorsFor('SenhaForte1');
    expect(errors.length).toBeGreaterThan(0);
  });
});
