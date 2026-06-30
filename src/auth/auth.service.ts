import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { AppError } from '../common/app-error';
import { GraphqlContext } from '../common/interfaces';
import { hashPassword, verifyPassword } from '../common/utils';
import { SessionService } from '../common/session.service';
import { userManagementRoles } from '../common/utils';
import { Role } from '../common/enums';
import { UserEntity } from '../users';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly sessionService: SessionService,
  ) {}

  async requireUser(context: GraphqlContext) {
    const id = this.sessionService.getSessionUserId(context);
    if (!id)
      throw new AppError('Debes iniciar sesión.', HttpStatus.UNAUTHORIZED);

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user)
      throw new AppError('La sesión ya no es válida.', HttpStatus.UNAUTHORIZED);
    if (!user.active)
      throw new AppError('Tu usuario está desactivado.', HttpStatus.FORBIDDEN);
    return user;
  }

  async requireRole(context: GraphqlContext, allowedRoles: Role[]) {
    const user = await this.requireUser(context);
    if (!allowedRoles.includes(user.role)) {
      throw new AppError(
        'No tienes permiso para realizar esta acción.',
        HttpStatus.FORBIDDEN,
      );
    }
    return user;
  }

  me(context: GraphqlContext) {
    return this.requireUser(context);
  }

  async login(
    context: GraphqlContext,
    usernameInput: string,
    password: string,
  ) {
    const username = usernameInput.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: [{ username }, { email: username }],
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new AppError(
        'Usuario o contraseña incorrectos.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (!user.active) {
      throw new AppError(
        'Tu usuario está desactivado. Contacta al administrador.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!user.username) {
      user.username = await this.generateUniqueUsername(user.fullName);
      await this.usersRepository.save(user);
    }

    this.sessionService.createSession(context, user.id);
    return user;
  }

  logout(context: GraphqlContext) {
    this.sessionService.clearSession(context);
    return { ok: true };
  }

  async register(
    context: GraphqlContext,
    input: {
      fullName: string;
      email: string;
      password: string;
      phone: string;
      role?: Role;
    },
  ) {
    const creator = await this.requireRole(context, userManagementRoles);
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();
    const role = input.role ?? Role.WORKER;

    if (creator.role === Role.ADMIN && role !== Role.WORKER) {
      throw new AppError(
        'Un administrador solo puede registrar colaboradores.',
        HttpStatus.FORBIDDEN,
      );
    }
    if (
      fullName.length < 3 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      input.password.length < 8 ||
      phone.length < 7
    ) {
      throw new AppError(
        'Revisa tus datos. La contraseña debe tener al menos 8 caracteres.',
      );
    }
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing)
      throw new AppError(
        'Ya existe una cuenta con este correo.',
        HttpStatus.CONFLICT,
      );

    const user = this.usersRepository.create({
      fullName,
      email,
      username: await this.generateUniqueUsername(fullName),
      phone,
      role,
      passwordHash: hashPassword(input.password),
    });
    return this.usersRepository.save(user);
  }

  private normalizeUsername(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 24);
  }

  private getBaseUsername(fullName: string) {
    const parts = this.normalizeUsername(fullName).split('.').filter(Boolean);
    return [parts[0] || 'usuario', parts[1] || '']
      .filter(Boolean)
      .join('.')
      .slice(0, 24);
  }

  private async generateUniqueUsername(fullName: string) {
    const baseUsername = this.getBaseUsername(fullName);
    let username = baseUsername;
    let suffix = 1;
    while (
      await this.usersRepository.findOne({
        where: { username: ILike(username) },
      })
    ) {
      suffix += 1;
      username = `${baseUsername}${suffix}`.slice(0, 28);
    }
    return username;
  }
}
