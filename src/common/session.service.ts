import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { GraphqlContext } from './interfaces';

const sessionCookie = 'abr_session';
const sessionMaxAge = 60 * 60 * 24 * 30;
const sessionMaxAgeMs = sessionMaxAge * 1000;

@Injectable()
export class SessionService {
  constructor(private readonly configService: ConfigService) {}

  createSession(context: GraphqlContext, userId: string) {
    const expiresAt = Date.now() + sessionMaxAgeMs;
    const payload = `${userId}.${expiresAt}`;
    const value = `${payload}.${this.sign(payload)}`;

    context.res.cookie(sessionCookie, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get('NODE_ENV') === 'production',
      path: '/',
      maxAge: sessionMaxAgeMs,
    });
  }

  clearSession(context: GraphqlContext) {
    context.res.clearCookie(sessionCookie, { path: '/' });
  }

  getSessionUserId(context: GraphqlContext) {
    const value = this.getCookie(context.req.headers.cookie, sessionCookie);
    if (!value) return null;

    const separator = value.lastIndexOf('.');
    const payload = value.slice(0, separator);
    const signature = value.slice(separator + 1);
    const expected = this.sign(payload);
    if (!payload || signature.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const payloadSeparator = payload.lastIndexOf('.');
    const userId = payload.slice(0, payloadSeparator);
    const expiresAt = Number(payload.slice(payloadSeparator + 1));
    if (!userId || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return null;
    }

    return userId;
  }

  private sign(value: string) {
    const secret = this.configService.get<string>(
      'SESSION_SECRET',
      'cambia-esta-clave-en-produccion',
    );
    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private getCookie(cookieHeader: string | undefined, name: string) {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const cookie = cookies.find((item) => item.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
  }
}
