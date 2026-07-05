import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { GraphqlContext } from './interfaces';

const sessionCookie = 'abr_session';
const sessionMaxAge = 60 * 60 * 24 * 30;
const jwtAlgorithm = 'HS256';

type JwtHeader = {
  alg: typeof jwtAlgorithm;
  typ: 'JWT';
};

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

@Injectable()
export class SessionService {
  constructor(private readonly configService: ConfigService) {}

  createSession(context: GraphqlContext, userId: string) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + sessionMaxAge;
    const value = this.createToken({
      sub: userId,
      iat: issuedAt,
      exp: expiresAt,
    });

    context.res.cookie(sessionCookie, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get('NODE_ENV') === 'production',
      path: '/',
      maxAge: sessionMaxAge * 1000,
    });
  }

  clearSession(context: GraphqlContext) {
    context.res.clearCookie(sessionCookie, { path: '/' });
  }

  getSessionUserId(context: GraphqlContext) {
    const value = this.getCookie(context.req.headers.cookie, sessionCookie);
    if (!value) return null;

    const payload = this.verifyToken(value);
    return payload?.sub ?? null;
  }

  private createToken(payload: SessionPayload) {
    const header: JwtHeader = { alg: jwtAlgorithm, typ: 'JWT' };
    const encodedHeader = this.encodeJson(header);
    const encodedPayload = this.encodeJson(payload);
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    return `${unsignedToken}.${this.sign(unsignedToken)}`;
  }

  private verifyToken(token: string) {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expected = this.sign(unsignedToken);
    if (signature.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const header = this.decodeJson<JwtHeader>(encodedHeader);
    if (header?.alg !== jwtAlgorithm || header.typ !== 'JWT') return null;

    const payload = this.decodeJson<SessionPayload>(encodedPayload);
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.sub || !Number.isFinite(payload.exp) || payload.exp <= now) {
      return null;
    }

    return payload;
  }

  private encodeJson(value: unknown) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private decodeJson<T>(value: string) {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
    } catch {
      return null;
    }
  }

  private sign(value: string) {
    const secret = this.secret();
    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private secret() {
    const secret = this.configService.get<string>('SESSION_SECRET');
    if (!secret || secret === 'cambia-esta-clave-en-produccion') {
      throw new Error('Configura SESSION_SECRET antes de iniciar sesión.');
    }

    return secret;
  }

  private getCookie(cookieHeader: string | undefined, name: string) {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const cookie = cookies.find((item) => item.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
  }
}
