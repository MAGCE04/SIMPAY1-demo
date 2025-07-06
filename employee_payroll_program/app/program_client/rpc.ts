import {
  AnchorProvider,
  BN,
  IdlAccounts,
  Program,
  web3,
} from "@coral-xyz/anchor";
import { MethodsBuilder } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";
import { EmployeePayroll } from "../../target/types/employee_payroll";
import idl from "../../target/idl/employee_payroll.json";
import * as pda from "./pda";



let _program: Program<EmployeePayroll>;


export const initializeClient = (
    programId: web3.PublicKey,
    anchorProvider = AnchorProvider.env(),
) => {
    _program = new Program<EmployeePayroll>(
        idl as never,
        programId,
        anchorProvider,
    );


};

export type InitializeEmployerArgs = {
  authority: web3.PublicKey;
  employer: web3.PublicKey;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Initialize the employer account
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable, signer]` employer: {@link PublicKey} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 */
export const initializeEmployerBuilder = (
	args: InitializeEmployerArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<EmployeePayroll, never> => {


  return _program
    .methods
    .initializeEmployer(

    )
    .accountsStrict({
      authority: args.authority,
      employer: args.employer,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Initialize the employer account
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable, signer]` employer: {@link PublicKey} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 */
export const initializeEmployer = (
	args: InitializeEmployerArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    initializeEmployerBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Initialize the employer account
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable, signer]` employer: {@link PublicKey} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 */
export const initializeEmployerSendAndConfirm = async (
  args: Omit<InitializeEmployerArgs, "authority" | "employer"> & {
    signers: {
      authority: web3.Signer,
      employer: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return initializeEmployerBuilder({
      ...args,
      authority: args.signers.authority.publicKey,
      employer: args.signers.employer.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.authority, args.signers.employer])
    .rpc();
}

export type RegisterEmployeeArgs = {
  authority: web3.PublicKey;
  name: string;
  position: string;
  hourlyRate: bigint;
  employeeWallet: web3.PublicKey;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Register a new employee
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - name: {@link string} 
 * - position: {@link string} 
 * - hourly_rate: {@link BigInt} 
 * - employee_wallet: {@link PublicKey} 
 */
export const registerEmployeeBuilder = (
	args: RegisterEmployeeArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<EmployeePayroll, never> => {
    const [employeePubkey] = pda.deriveEmployeeAccountPDA({
        employeeWallet: args.employeeWallet,
    }, _program.programId);

  return _program
    .methods
    .registerEmployee(
      args.name,
      args.position,
      new BN(args.hourlyRate.toString()),
      args.employeeWallet,
    )
    .accountsStrict({
      authority: args.authority,
      employee: employeePubkey,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Register a new employee
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - name: {@link string} 
 * - position: {@link string} 
 * - hourly_rate: {@link BigInt} 
 * - employee_wallet: {@link PublicKey} 
 */
export const registerEmployee = (
	args: RegisterEmployeeArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    registerEmployeeBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Register a new employee
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - name: {@link string} 
 * - position: {@link string} 
 * - hourly_rate: {@link BigInt} 
 * - employee_wallet: {@link PublicKey} 
 */
export const registerEmployeeSendAndConfirm = async (
  args: Omit<RegisterEmployeeArgs, "authority"> & {
    signers: {
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return registerEmployeeBuilder({
      ...args,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.authority])
    .rpc();
}

export type UpdateEmployeeArgs = {
  authority: web3.PublicKey;
  name: string;
  position: string;
  hourlyRate: bigint;
  isActive: boolean;
  employeeWallet: web3.PublicKey;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Update employee information
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 *
 * Data:
 * - name: {@link string} 
 * - position: {@link string} 
 * - hourly_rate: {@link BigInt} 
 * - is_active: {@link boolean} 
 * - employee_wallet: {@link PublicKey} 
 */
export const updateEmployeeBuilder = (
	args: UpdateEmployeeArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<EmployeePayroll, never> => {
    const [employeePubkey] = pda.deriveEmployeeAccountPDA({
        employeeWallet: args.employeeWallet,
    }, _program.programId);

  return _program
    .methods
    .updateEmployee(
      args.name,
      args.position,
      new BN(args.hourlyRate.toString()),
      args.isActive,
      args.employeeWallet,
    )
    .accountsStrict({
      authority: args.authority,
      employee: employeePubkey,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Update employee information
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 *
 * Data:
 * - name: {@link string} 
 * - position: {@link string} 
 * - hourly_rate: {@link BigInt} 
 * - is_active: {@link boolean} 
 * - employee_wallet: {@link PublicKey} 
 */
export const updateEmployee = (
	args: UpdateEmployeeArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    updateEmployeeBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Update employee information
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 *
 * Data:
 * - name: {@link string} 
 * - position: {@link string} 
 * - hourly_rate: {@link BigInt} 
 * - is_active: {@link boolean} 
 * - employee_wallet: {@link PublicKey} 
 */
export const updateEmployeeSendAndConfirm = async (
  args: Omit<UpdateEmployeeArgs, "authority"> & {
    signers: {
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return updateEmployeeBuilder({
      ...args,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.authority])
    .rpc();
}

export type CheckInArgs = {
  authority: web3.PublicKey;
  employeeWallet: web3.PublicKey;
  sessionId: bigint;
  timestamp: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Employee checks in to start work
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[]` employee: {@link Employee} 
 * 2. `[writable]` work_session: {@link WorkSession} 
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const checkInBuilder = (
	args: CheckInArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<EmployeePayroll, never> => {
    const [employeePubkey] = pda.deriveEmployeeAccountPDA({
        employeeWallet: args.employeeWallet,
    }, _program.programId);
    const [workSessionPubkey] = pda.deriveWorkSessionAccountPDA({
        employee: args.employeeWallet,
        sessionId: args.sessionId,
    }, _program.programId);

  return _program
    .methods
    .checkIn(
      args.employeeWallet,
      new BN(args.sessionId.toString()),
      new BN(args.timestamp.toString()),
    )
    .accountsStrict({
      authority: args.authority,
      employee: employeePubkey,
      workSession: workSessionPubkey,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Employee checks in to start work
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[]` employee: {@link Employee} 
 * 2. `[writable]` work_session: {@link WorkSession} 
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const checkIn = (
	args: CheckInArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    checkInBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Employee checks in to start work
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[]` employee: {@link Employee} 
 * 2. `[writable]` work_session: {@link WorkSession} 
 * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const checkInSendAndConfirm = async (
  args: Omit<CheckInArgs, "authority"> & {
    signers: {
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return checkInBuilder({
      ...args,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.authority])
    .rpc();
}

export type CheckOutArgs = {
  authority: web3.PublicKey;
  employeeWallet: web3.PublicKey;
  sessionId: bigint;
  timestamp: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Employee checks out to end work
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 * 2. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const checkOutBuilder = (
	args: CheckOutArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<EmployeePayroll, never> => {
    const [employeePubkey] = pda.deriveEmployeeAccountPDA({
        employeeWallet: args.employeeWallet,
    }, _program.programId);
    const [workSessionPubkey] = pda.deriveWorkSessionAccountPDA({
        employee: args.employeeWallet,
        sessionId: args.sessionId,
    }, _program.programId);

  return _program
    .methods
    .checkOut(
      args.employeeWallet,
      new BN(args.sessionId.toString()),
      new BN(args.timestamp.toString()),
    )
    .accountsStrict({
      authority: args.authority,
      employee: employeePubkey,
      workSession: workSessionPubkey,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Employee checks out to end work
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 * 2. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const checkOut = (
	args: CheckOutArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    checkOutBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Employee checks out to end work
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` employee: {@link Employee} 
 * 2. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const checkOutSendAndConfirm = async (
  args: Omit<CheckOutArgs, "authority"> & {
    signers: {
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return checkOutBuilder({
      ...args,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.authority])
    .rpc();
}

export type CreatePayrollBatchArgs = {
  authority: web3.PublicKey;
  batchId: bigint;
  timestamp: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Create a new payroll batch for processing
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` payroll_batch: {@link PayrollBatch} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - batch_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const createPayrollBatchBuilder = (
	args: CreatePayrollBatchArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<EmployeePayroll, never> => {
    const [payrollBatchPubkey] = pda.derivePayrollBatchAccountPDA({
        batchId: args.batchId,
    }, _program.programId);

  return _program
    .methods
    .createPayrollBatch(
      new BN(args.batchId.toString()),
      new BN(args.timestamp.toString()),
    )
    .accountsStrict({
      authority: args.authority,
      payrollBatch: payrollBatchPubkey,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Create a new payroll batch for processing
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` payroll_batch: {@link PayrollBatch} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - batch_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const createPayrollBatch = (
	args: CreatePayrollBatchArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    createPayrollBatchBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Create a new payroll batch for processing
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` payroll_batch: {@link PayrollBatch} 
 * 2. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - batch_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const createPayrollBatchSendAndConfirm = async (
  args: Omit<CreatePayrollBatchArgs, "authority"> & {
    signers: {
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return createPayrollBatchBuilder({
      ...args,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.authority])
    .rpc();
}

export type ProcessPayrollArgs = {
  authority: web3.PublicKey;
  employee: web3.PublicKey;
  workSession: web3.PublicKey;
  batchId: bigint;
  timestamp: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Process payments for all employees in a batch
 *
 * Accounts:
 * 0. `[writable, signer]` authority: {@link PublicKey} 
 * 1. `[writable]` payroll_batch: {@link PayrollBatch} 
 * 2. `[writable]` employee: {@link Employee} 
 * 3. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - batch_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const processPayrollBuilder = (
	args: ProcessPayrollArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<EmployeePayroll, never> => {
    const [payrollBatchPubkey] = pda.derivePayrollBatchAccountPDA({
        batchId: args.batchId,
    }, _program.programId);

  return _program
    .methods
    .processPayroll(
      new BN(args.batchId.toString()),
      new BN(args.timestamp.toString()),
    )
    .accountsStrict({
      authority: args.authority,
      payrollBatch: payrollBatchPubkey,
      employee: args.employee,
      workSession: args.workSession,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Process payments for all employees in a batch
 *
 * Accounts:
 * 0. `[writable, signer]` authority: {@link PublicKey} 
 * 1. `[writable]` payroll_batch: {@link PayrollBatch} 
 * 2. `[writable]` employee: {@link Employee} 
 * 3. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - batch_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const processPayroll = (
	args: ProcessPayrollArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    processPayrollBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Process payments for all employees in a batch
 *
 * Accounts:
 * 0. `[writable, signer]` authority: {@link PublicKey} 
 * 1. `[writable]` payroll_batch: {@link PayrollBatch} 
 * 2. `[writable]` employee: {@link Employee} 
 * 3. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - batch_id: {@link BigInt} 
 * - timestamp: {@link BigInt} 
 */
export const processPayrollSendAndConfirm = async (
  args: Omit<ProcessPayrollArgs, "authority"> & {
    signers: {
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return processPayrollBuilder({
      ...args,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.authority])
    .rpc();
}

export type MarkSessionPaidArgs = {
  authority: web3.PublicKey;
  employeeWallet: web3.PublicKey;
  sessionId: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Mark a work session as paid
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 */
export const markSessionPaidBuilder = (
	args: MarkSessionPaidArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<EmployeePayroll, never> => {
    const [workSessionPubkey] = pda.deriveWorkSessionAccountPDA({
        employee: args.employeeWallet,
        sessionId: args.sessionId,
    }, _program.programId);

  return _program
    .methods
    .markSessionPaid(
      args.employeeWallet,
      new BN(args.sessionId.toString()),
    )
    .accountsStrict({
      authority: args.authority,
      workSession: workSessionPubkey,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Mark a work session as paid
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 */
export const markSessionPaid = (
	args: MarkSessionPaidArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    markSessionPaidBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Mark a work session as paid
 *
 * Accounts:
 * 0. `[signer]` authority: {@link PublicKey} 
 * 1. `[writable]` work_session: {@link WorkSession} 
 *
 * Data:
 * - employee_wallet: {@link PublicKey} 
 * - session_id: {@link BigInt} 
 */
export const markSessionPaidSendAndConfirm = async (
  args: Omit<MarkSessionPaidArgs, "authority"> & {
    signers: {
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return markSessionPaidBuilder({
      ...args,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.authority])
    .rpc();
}

// Getters

export const getEmployee = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<EmployeePayroll>["employee"]> => _program.account.employee.fetch(publicKey, commitment);

export const getWorkSession = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<EmployeePayroll>["workSession"]> => _program.account.workSession.fetch(publicKey, commitment);

export const getPayrollBatch = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<EmployeePayroll>["payrollBatch"]> => _program.account.payrollBatch.fetch(publicKey, commitment);
