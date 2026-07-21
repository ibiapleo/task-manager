import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_STRONG_LENGTH = 12;

export const PASSWORD_SPECIAL_CHARS = `!@#$%^&*()_+-=[]{};':"\\|,.<>/?`;

export const PASSWORD_HAS_UPPERCASE = /[A-Z]/;
export const PASSWORD_HAS_LOWERCASE = /[a-z]/;
export const PASSWORD_HAS_DIGIT = /[0-9]/;
export const PASSWORD_HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.';

export type PasswordRuleId =
  | 'minLength'
  | 'uppercase'
  | 'lowercase'
  | 'digit'
  | 'special';

export interface PasswordRule {
  id: PasswordRuleId;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'minLength',
    label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'uppercase',
    label: 'Uma letra maiúscula',
    test: (password) => PASSWORD_HAS_UPPERCASE.test(password),
  },
  {
    id: 'lowercase',
    label: 'Uma letra minúscula',
    test: (password) => PASSWORD_HAS_LOWERCASE.test(password),
  },
  {
    id: 'digit',
    label: 'Um número',
    test: (password) => PASSWORD_HAS_DIGIT.test(password),
  },
  {
    id: 'special',
    label: 'Um caractere especial',
    test: (password) => PASSWORD_HAS_SPECIAL.test(password),
  },
];

export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

export interface PasswordEvaluation {
  rules: Array<{ id: PasswordRuleId; label: string; met: boolean }>;
  metCount: number;
  isValid: boolean;
  strength: PasswordStrength;
  strengthLabel: string;
}

export function evaluatePassword(password: string): PasswordEvaluation {
  const rules = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }));
  const metCount = rules.filter((rule) => rule.met).length;
  const isValid = metCount === PASSWORD_RULES.length;

  let strength: PasswordStrength = 'empty';
  if (password.length === 0) {
    strength = 'empty';
  } else if (!isValid) {
    strength = metCount <= 2 ? 'weak' : 'medium';
  } else if (password.length >= PASSWORD_STRONG_LENGTH) {
    strength = 'strong';
  } else {
    strength = 'medium';
  }

  const strengthLabel =
    strength === 'empty'
      ? ''
      : strength === 'weak'
        ? 'Fraca'
        : strength === 'medium'
          ? 'Média'
          : 'Forte';

  return { rules, metCount, isValid, strength, strengthLabel };
}

export const StrongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .regex(PASSWORD_HAS_LOWERCASE, 'A senha deve conter ao menos uma letra minúscula.')
  .regex(PASSWORD_HAS_UPPERCASE, 'A senha deve conter ao menos uma letra maiúscula.')
  .regex(PASSWORD_HAS_DIGIT, 'A senha deve conter ao menos um número.')
  .regex(
    PASSWORD_HAS_SPECIAL,
    'A senha deve conter ao menos um caractere especial.',
  );

export const RegisterInputSchema = z
  .object({
    email: z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.'),
    password: StrongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const RegisterResponseSchema = z.object({
  requiresEmailConfirmation: z.boolean(),
  session: z
    .object({
      accessToken: z.string(),
      refreshToken: z.string(),
    })
    .nullable(),
});
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
