export const ALLOWED_SYMBOLS = "!@#$%^&*()+=";

const LETTER_REGEX = /[a-zA-Z]/;
const NUMBER_REGEX = /[0-9]/;
const SYMBOL_REGEX = /[!@#$%^&*()+=]/;
const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9!@#$%^&*()+=]*$/;
const MIN_LENGTH = 8;

export interface PasswordCheck {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  onlyAllowedChars: boolean;
  valid: boolean;
}

export function checkPassword(password: string): PasswordCheck {
  const minLength = password.length >= MIN_LENGTH;
  const hasLetter = LETTER_REGEX.test(password);
  const hasNumber = NUMBER_REGEX.test(password);
  const hasSymbol = SYMBOL_REGEX.test(password);
  const onlyAllowedChars = password.length > 0 && ALLOWED_CHARS_REGEX.test(password);

  return {
    minLength,
    hasLetter,
    hasNumber,
    hasSymbol,
    onlyAllowedChars,
    valid: minLength && hasLetter && hasNumber && hasSymbol && onlyAllowedChars,
  };
}