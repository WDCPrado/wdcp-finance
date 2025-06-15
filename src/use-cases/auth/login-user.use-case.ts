import type {
  IUserRepository,
  UserWithProfile,
} from "../../interfaces/user-repository.interface";
import { UserRepository } from "../../repositories/user.repository";

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  user: UserWithProfile | null;
  success: boolean;
  message: string;
}

export class LoginUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const { email, password } = request;

    // Validar datos de entrada
    if (!email || !password) {
      return {
        user: null,
        success: false,
        message: "Email y contraseña son requeridos",
      };
    }

    try {
      // Buscar usuario por email (incluye contraseña para verificación)
      const user = await this.userRepository.findByEmail(email.toLowerCase());

      if (!user) {
        return {
          user: null,
          success: false,
          message: "Credenciales inválidas",
        };
      }

      // Verificar contraseña
      const userRepo = this.userRepository as UserRepository;
      const isValidPassword = await userRepo.verifyPassword(
        password,
        user.password
      );

      if (!isValidPassword) {
        return {
          user: null,
          success: false,
          message: "Credenciales inválidas",
        };
      }

      // Obtener datos del usuario sin contraseña
      const userWithoutPassword = await this.userRepository.findById(user.id);

      if (!userWithoutPassword) {
        return {
          user: null,
          success: false,
          message: "Error interno del servidor",
        };
      }

      return {
        user: userWithoutPassword,
        success: true,
        message: "Login exitoso",
      };
    } catch (error) {
      console.error("[LoginUserUseCase] Error:", error);
      return {
        user: null,
        success: false,
        message: "Error interno del servidor",
      };
    }
  }
}
