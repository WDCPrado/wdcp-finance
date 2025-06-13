import { IBudgetRepository } from "../interfaces/budget-repository.interface";
import { BudgetRepository } from "../repositories/budget.repository";

// Use Cases
import { CreateBudgetUseCase } from "../use-cases/budget/create-budget.use-case";
import { AddTransactionUseCase } from "../use-cases/budget/add-transaction.use-case";
import { GetCurrentBudgetUseCase } from "../use-cases/budget/get-current-budget.use-case";
import { GetBudgetByMonthUseCase } from "../use-cases/budget/get-budget-by-month.use-case";
import { DeleteBudgetUseCase } from "../use-cases/budget/delete-budget.use-case";
import { EditBudgetUseCase } from "../use-cases/budget/edit-budget.use-case";
import { CreateRecurrentTransactionUseCase } from "../use-cases/budget/create-recurrent-transaction.use-case";
import { ProcessRecurrentTransactionsUseCase } from "../use-cases/budget/process-recurrent-transactions.use-case";
import { ManageRecurrentTransactionsUseCase } from "../use-cases/budget/manage-recurrent-transactions.use-case";

export class DIContainer {
  private static instance: DIContainer;

  // Repositorios
  private readonly _budgetRepository: IBudgetRepository;

  // Casos de uso
  private readonly _createBudgetUseCase: CreateBudgetUseCase;
  private readonly _addTransactionUseCase: AddTransactionUseCase;
  private readonly _getCurrentBudgetUseCase: GetCurrentBudgetUseCase;
  private readonly _getBudgetByMonthUseCase: GetBudgetByMonthUseCase;
  private readonly _deleteBudgetUseCase: DeleteBudgetUseCase;
  private readonly _editBudgetUseCase: EditBudgetUseCase;
  private readonly _createRecurrentTransactionUseCase: CreateRecurrentTransactionUseCase;
  private readonly _processRecurrentTransactionsUseCase: ProcessRecurrentTransactionsUseCase;
  private readonly _manageRecurrentTransactionsUseCase: ManageRecurrentTransactionsUseCase;

  private constructor() {
    // Inicializar repositorios
    this._budgetRepository = new BudgetRepository();

    // Inicializar casos de uso con inyección de dependencias
    this._createBudgetUseCase = new CreateBudgetUseCase(this._budgetRepository);
    this._addTransactionUseCase = new AddTransactionUseCase(
      this._budgetRepository
    );
    this._getCurrentBudgetUseCase = new GetCurrentBudgetUseCase(
      this._budgetRepository
    );
    this._getBudgetByMonthUseCase = new GetBudgetByMonthUseCase(
      this._budgetRepository
    );
    this._deleteBudgetUseCase = new DeleteBudgetUseCase(this._budgetRepository);
    this._editBudgetUseCase = new EditBudgetUseCase(this._budgetRepository);
    this._createRecurrentTransactionUseCase =
      new CreateRecurrentTransactionUseCase(this._budgetRepository);
    this._processRecurrentTransactionsUseCase =
      new ProcessRecurrentTransactionsUseCase(this._budgetRepository);
    this._manageRecurrentTransactionsUseCase =
      new ManageRecurrentTransactionsUseCase(this._budgetRepository);
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  // Getters para repositorios
  public get budgetRepository(): IBudgetRepository {
    return this._budgetRepository;
  }

  // Getters para casos de uso
  public get createBudgetUseCase(): CreateBudgetUseCase {
    return this._createBudgetUseCase;
  }

  public get addTransactionUseCase(): AddTransactionUseCase {
    return this._addTransactionUseCase;
  }

  public get getCurrentBudgetUseCase(): GetCurrentBudgetUseCase {
    return this._getCurrentBudgetUseCase;
  }

  public get getBudgetByMonthUseCase(): GetBudgetByMonthUseCase {
    return this._getBudgetByMonthUseCase;
  }

  public get deleteBudgetUseCase(): DeleteBudgetUseCase {
    return this._deleteBudgetUseCase;
  }

  public get editBudgetUseCase(): EditBudgetUseCase {
    return this._editBudgetUseCase;
  }

  public get createRecurrentTransactionUseCase(): CreateRecurrentTransactionUseCase {
    return this._createRecurrentTransactionUseCase;
  }

  public get processRecurrentTransactionsUseCase(): ProcessRecurrentTransactionsUseCase {
    return this._processRecurrentTransactionsUseCase;
  }

  public get manageRecurrentTransactionsUseCase(): ManageRecurrentTransactionsUseCase {
    return this._manageRecurrentTransactionsUseCase;
  }
}

// Exportar instancia singleton
export const container = DIContainer.getInstance();
