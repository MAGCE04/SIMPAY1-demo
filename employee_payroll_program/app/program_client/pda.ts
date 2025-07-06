import {PublicKey} from "@solana/web3.js";
import {BN} from "@coral-xyz/anchor";

export type EmployeeAccountSeeds = {
    employeeWallet: PublicKey, 
};

export const deriveEmployeeAccountPDA = (
    seeds: EmployeeAccountSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("employee"),
            seeds.employeeWallet.toBuffer(),
        ],
        programId,
    )
};

export type WorkSessionAccountSeeds = {
    employee: PublicKey, 
    sessionId: bigint, 
};

export const deriveWorkSessionAccountPDA = (
    seeds: WorkSessionAccountSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("work_session"),
            seeds.employee.toBuffer(),
            Buffer.from(BigUint64Array.from([seeds.sessionId]).buffer),
        ],
        programId,
    )
};

export type PayrollBatchAccountSeeds = {
    batchId: bigint, 
};

export const derivePayrollBatchAccountPDA = (
    seeds: PayrollBatchAccountSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("payroll_batch"),
            Buffer.from(BigUint64Array.from([seeds.batchId]).buffer),
        ],
        programId,
    )
};

