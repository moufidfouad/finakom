import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export function hashPassword(
  password: string,
  saltOrRounds: string | number = SALT_ROUNDS,
): Promise<string> {
  return bcrypt.hash(password, saltOrRounds);
}

export function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
