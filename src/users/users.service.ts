import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { AppError } from '../common/app-error';
import { GraphqlContext } from '../common/interfaces';
import { hashPassword } from '../common/utils';
import {
  canManageRole,
  getVisibleRoles,
  userManagementRoles,
} from '../common/utils';
import { UserEntity } from './user.entity';
import { UpdateUserInput } from './users.inputs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly authService: AuthService,
  ) {}

  async users(context: GraphqlContext, searchInput?: string) {
    const user = await this.authService.requireRole(
      context,
      userManagementRoles,
    );
    const visibleRoles = getVisibleRoles(user.role);
    const search = searchInput?.trim().slice(0, 80);
    const where = visibleRoles.map((role) => ({ role }));

    if (!search) {
      return this.usersRepository.find({
        where,
        order: { active: 'DESC', fullName: 'ASC' },
        take: 100,
      });
    }

    return this.usersRepository.find({
      where: visibleRoles.flatMap((role) => [
        { role, fullName: ILike(`%${search}%`) },
        { role, email: ILike(`%${search}%`) },
        { role, username: ILike(`%${search}%`) },
        { role, phone: ILike(`%${search}%`) },
      ]),
      order: { active: 'DESC', fullName: 'ASC' },
      take: 100,
    });
  }

  async updateUser(
    context: GraphqlContext,
    id: string,
    input: UpdateUserInput,
  ) {
    const manager = await this.authService.requireRole(
      context,
      userManagementRoles,
    );
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user)
      throw new AppError('Usuario no encontrado.', HttpStatus.NOT_FOUND);
    if (!canManageRole(manager.role, user.role)) {
      throw new AppError(
        'No tienes permiso para editar este usuario.',
        HttpStatus.FORBIDDEN,
      );
    }

    const role = input.role ?? user.role;
    if (id === manager.id && input.active === false)
      throw new AppError('No puedes desactivar tu propio usuario.');
    if (!canManageRole(manager.role, role))
      throw new AppError('No puedes asignar ese rol.', HttpStatus.FORBIDDEN);
    if (
      input.fullName.trim().length < 3 ||
      !/^\S+@\S+\.\S+$/.test(input.email.trim()) ||
      input.phone.trim().length < 7
    ) {
      throw new AppError('Revisa nombre, correo y teléfono.');
    }
    if (input.password && input.password.length < 8)
      throw new AppError('La contraseña debe tener al menos 8 caracteres.');

    user.fullName = input.fullName.trim();
    user.email = input.email.trim().toLowerCase();
    user.phone = input.phone.trim();
    user.role = role;
    if (typeof input.active === 'boolean') user.active = input.active;
    if (input.password) user.passwordHash = hashPassword(input.password);

    try {
      return await this.usersRepository.save(user);
    } catch {
      throw new AppError(
        'Ya existe otro usuario con ese correo.',
        HttpStatus.CONFLICT,
      );
    }
  }

  async deactivateUser(context: GraphqlContext, id: string) {
    const manager = await this.authService.requireRole(
      context,
      userManagementRoles,
    );
    if (id === manager.id)
      throw new AppError('No puedes desactivar tu propio usuario.');
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user)
      throw new AppError('Usuario no encontrado.', HttpStatus.NOT_FOUND);
    if (!canManageRole(manager.role, user.role)) {
      throw new AppError(
        'No tienes permiso para desactivar este usuario.',
        HttpStatus.FORBIDDEN,
      );
    }
    user.active = false;
    return this.usersRepository.save(user);
  }
}
