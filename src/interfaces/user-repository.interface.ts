import type { User } from "@prisma/client";

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
}

export type UserWithProfile = Omit<User, "password">;

export interface IUserRepository {
  // Crear usuario
  create(data: CreateUserData): Promise<UserWithProfile>;

  // Buscar usuario por email
  findByEmail(email: string): Promise<User | null>;

  // Buscar usuario por ID
  findById(id: string): Promise<UserWithProfile | null>;

  // Actualizar usuario
  update(id: string, data: Partial<CreateUserData>): Promise<UserWithProfile>;

  // Eliminar usuario
  delete(id: string): Promise<void>;

  // Verificar si existe un usuario con ese email
  existsByEmail(email: string): Promise<boolean>;
}
