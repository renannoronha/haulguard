import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class PasswordService {
  private readonly rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  private readonly pepper = process.env.BCRYPT_PEPPER ?? "";

  private withPepper(plain: string) {
    return `${plain}${this.pepper}`;
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(this.withPepper(plain), this.rounds);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return bcrypt.compare(this.withPepper(plain), hash);
  }

  /** Se você aumentar BCRYPT_ROUNDS no futuro, isto permite rehash transparente no login. */
  isHashOutdated(hash: string): boolean {
    const current = bcrypt.getRounds?.(hash);
    return typeof current === "number" && current < this.rounds;
  }
}
