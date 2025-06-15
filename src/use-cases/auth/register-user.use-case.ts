import type {
  IUserRepository,
  CreateUserData,
  UserWithProfile,
} from "../../interfaces/user-repository.interface";

export interface RegisterUserRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterUserResponse {
  user: UserWithProfile;
  success: boolean;
  message: string;
}

export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const { email, password, name } = request;

    // Validar datos de entrada
    if (!email || !password) {
      return {
        user: {} as UserWithProfile,
        success: false,
        message: "Email y contraseña son requeridos",
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        user: {} as UserWithProfile,
        success: false,
        message: "El formato del email es inválido",
      };
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return {
        user: {} as UserWithProfile,
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres",
      };
    }

    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.existsByEmail(email);
      if (existingUser) {
        return {
          user: {} as UserWithProfile,
          success: false,
          message: "Ya existe un usuario con este email",
        };
      }

      // Crear el usuario
      const userData: CreateUserData = {
        email: email.toLowerCase(),
        password,
        name: name?.trim(),
      };

      const user = await this.userRepository.create(userData);

      return {
        user,
        success: true,
        message: "Usuario registrado exitosamente",
      };
    } catch (error) {
      console.error("[RegisterUserUseCase] Error:", error);
      return {
        user: {} as UserWithProfile,
        success: false,
        message: "Error interno del servidor",
      };
    }
  }
}
