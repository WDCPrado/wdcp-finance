import { BudgetRepository } from "../repositories/budget.repository";
import { PrismaBudgetRepository } from "../repositories/prisma-budget.repository";
import { UserRepository } from "../repositories/user.repository";
import { IBudgetRepository } from "../interfaces/budget-repository.interface";
import { IUserRepository } from "../interfaces/user-repository.interface";
import { PrismaClient } from "@prisma/client";

// Use Cases
import { CreateBudgetUseCase } from "../use-cases/budget/create-budget.use-case";
import { GetCurrentBudgetUseCase } from "../use-cases/budget/get-current-budget.use-case";
import { AddTransactionUseCase } from "../use-cases/budget/add-transaction.use-case";
import { GetBudgetByMonthUseCase } from "../use-cases/budget/get-budget-by-month.use-case";
import { DeleteBudgetUseCase } from "../use-cases/budget/delete-budget.use-case";
import { EditBudgetUseCase } from "../use-cases/budget/edit-budget.use-case";
import { CreateRecurrentTransactionUseCase } from "../use-cases/budget/create-recurrent-transaction.use-case";
import { ProcessRecurrentTransactionsUseCase } from "../use-cases/budget/process-recurrent-transactions.use-case";
import { ManageRecurrentTransactionsUseCase } from "../use-cases/budget/manage-recurrent-transactions.use-case";

// Auth Use Cases
import { RegisterUserUseCase } from "../use-cases/auth/register-user.use-case";
import { LoginUserUseCase } from "../use-cases/auth/login-user.use-case";

class DIContainer {
  // Repositories
  private _budgetRepository?: IBudgetRepository;
  private _userRepository?: IUserRepository;
  private _prisma?: PrismaClient;

  // Budget Use Cases
  private _createBudgetUseCase?: CreateBudgetUseCase;
  private _getCurrentBudgetUseCase?: GetCurrentBudgetUseCase;
  private _addTransactionUseCase?: AddTransactionUseCase;
  private _getBudgetByMonthUseCase?: GetBudgetByMonthUseCase;
  private _deleteBudgetUseCase?: DeleteBudgetUseCase;
  private _editBudgetUseCase?: EditBudgetUseCase;
  private _createRecurrentTransactionUseCase?: CreateRecurrentTransactionUseCase;
  private _processRecurrentTransactionsUseCase?: ProcessRecurrentTransactionsUseCase;
  private _manageRecurrentTransactionsUseCase?: ManageRecurrentTransactionsUseCase;

  // Auth Use Cases
  private _registerUserUseCase?: RegisterUserUseCase;
  private _loginUserUseCase?: LoginUserUseCase;

  // Prisma client getter
  get prisma(): PrismaClient {
    if (!this._prisma) {
      this._prisma = new PrismaClient();
    }
    return this._prisma;
  }

  // Repository getters
  get budgetRepository(): IBudgetRepository {
    if (!this._budgetRepository) {
      // Use Prisma repository if available, fallback to in-memory
      this._budgetRepository = process.env.DATABASE_URL
        ? new PrismaBudgetRepository(this.prisma)
        : new BudgetRepository();
    }
    return this._budgetRepository;
  }

  get userRepository(): IUserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  // Budget Use Case getters
  get createBudgetUseCase(): CreateBudgetUseCase {
    if (!this._createBudgetUseCase) {
      this._createBudgetUseCase = new CreateBudgetUseCase(
        this.budgetRepository
      );
    }
    return this._createBudgetUseCase;
  }

  get getCurrentBudgetUseCase(): GetCurrentBudgetUseCase {
    if (!this._getCurrentBudgetUseCase) {
      this._getCurrentBudgetUseCase = new GetCurrentBudgetUseCase(
        this.budgetRepository
      );
    }
    return this._getCurrentBudgetUseCase;
  }

  get addTransactionUseCase(): AddTransactionUseCase {
    if (!this._addTransactionUseCase) {
      this._addTransactionUseCase = new AddTransactionUseCase(
        this.budgetRepository
      );
    }
    return this._addTransactionUseCase;
  }

  get getBudgetByMonthUseCase(): GetBudgetByMonthUseCase {
    if (!this._getBudgetByMonthUseCase) {
      this._getBudgetByMonthUseCase = new GetBudgetByMonthUseCase(
        this.budgetRepository
      );
    }
    return this._getBudgetByMonthUseCase;
  }

  get deleteBudgetUseCase(): DeleteBudgetUseCase {
    if (!this._deleteBudgetUseCase) {
      this._deleteBudgetUseCase = new DeleteBudgetUseCase(
        this.budgetRepository
      );
    }
    return this._deleteBudgetUseCase;
  }

  get editBudgetUseCase(): EditBudgetUseCase {
    if (!this._editBudgetUseCase) {
      this._editBudgetUseCase = new EditBudgetUseCase(this.budgetRepository);
    }
    return this._editBudgetUseCase;
  }

  get createRecurrentTransactionUseCase(): CreateRecurrentTransactionUseCase {
    if (!this._createRecurrentTransactionUseCase) {
      this._createRecurrentTransactionUseCase =
        new CreateRecurrentTransactionUseCase(this.budgetRepository);
    }
    return this._createRecurrentTransactionUseCase;
  }

  get processRecurrentTransactionsUseCase(): ProcessRecurrentTransactionsUseCase {
    if (!this._processRecurrentTransactionsUseCase) {
      this._processRecurrentTransactionsUseCase =
        new ProcessRecurrentTransactionsUseCase(this.budgetRepository);
    }
    return this._processRecurrentTransactionsUseCase;
  }

  get manageRecurrentTransactionsUseCase(): ManageRecurrentTransactionsUseCase {
    if (!this._manageRecurrentTransactionsUseCase) {
      this._manageRecurrentTransactionsUseCase =
        new ManageRecurrentTransactionsUseCase(this.budgetRepository);
    }
    return this._manageRecurrentTransactionsUseCase;
  }

  // Auth Use Case getters
  get registerUserUseCase(): RegisterUserUseCase {
    if (!this._registerUserUseCase) {
      this._registerUserUseCase = new RegisterUserUseCase(this.userRepository);
    }
    return this._registerUserUseCase;
  }

  get loginUserUseCase(): LoginUserUseCase {
    if (!this._loginUserUseCase) {
      this._loginUserUseCase = new LoginUserUseCase(this.userRepository);
    }
    return this._loginUserUseCase;
  }
}

export const container = new DIContainer();
