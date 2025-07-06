
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use std::str::FromStr;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("CJL2foUtZDC8vE9MF3Tb2BeJrfDZsVCkZD2pkdPV9b4X");

#[program]
pub mod employee_payroll {
    use super::*;

/// Initialize the employer account
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[writable, signer]` employer: [AccountInfo] 
/// 2. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
	pub fn initialize_employer(ctx: Context<InitializeEmployer>) -> Result<()> {
		initialize_employer::handler(ctx)
	}

/// Register a new employee
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[writable]` employee: [Employee] 
/// 2. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
///
/// Data:
/// - name: [String] 
/// - position: [String] 
/// - hourly_rate: [u64] 
/// - employee_wallet: [Pubkey] 
	pub fn register_employee(ctx: Context<RegisterEmployee>, name: String, position: String, hourly_rate: u64, employee_wallet: Pubkey) -> Result<()> {
		register_employee::handler(ctx, name, position, hourly_rate, employee_wallet)
	}

/// Update employee information
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[writable]` employee: [Employee] 
///
/// Data:
/// - name: [String] 
/// - position: [String] 
/// - hourly_rate: [u64] 
/// - is_active: [bool] 
/// - employee_wallet: [Pubkey] 
	pub fn update_employee(ctx: Context<UpdateEmployee>, name: String, position: String, hourly_rate: u64, is_active: bool, employee_wallet: Pubkey) -> Result<()> {
		update_employee::handler(ctx, name, position, hourly_rate, is_active, employee_wallet)
	}

/// Employee checks in to start work
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[]` employee: [Employee] 
/// 2. `[writable]` work_session: [WorkSession] 
/// 3. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
///
/// Data:
/// - employee_wallet: [Pubkey] 
/// - session_id: [u64] 
/// - timestamp: [i64] 
	pub fn check_in(ctx: Context<CheckIn>, employee_wallet: Pubkey, session_id: u64, timestamp: i64) -> Result<()> {
		check_in::handler(ctx, employee_wallet, session_id, timestamp)
	}

/// Employee checks out to end work
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[writable]` employee: [Employee] 
/// 2. `[writable]` work_session: [WorkSession] 
///
/// Data:
/// - employee_wallet: [Pubkey] 
/// - session_id: [u64] 
/// - timestamp: [i64] 
	pub fn check_out(ctx: Context<CheckOut>, employee_wallet: Pubkey, session_id: u64, timestamp: i64) -> Result<()> {
		check_out::handler(ctx, employee_wallet, session_id, timestamp)
	}

/// Create a new payroll batch for processing
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[writable]` payroll_batch: [PayrollBatch] 
/// 2. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
///
/// Data:
/// - batch_id: [u64] 
/// - timestamp: [i64] 
	pub fn create_payroll_batch(ctx: Context<CreatePayrollBatch>, batch_id: u64, timestamp: i64) -> Result<()> {
		create_payroll_batch::handler(ctx, batch_id, timestamp)
	}

/// Process payments for all employees in a batch
///
/// Accounts:
/// 0. `[writable, signer]` authority: [AccountInfo] 
/// 1. `[writable]` payroll_batch: [PayrollBatch] 
/// 2. `[writable]` employee: [Employee] 
/// 3. `[writable]` work_session: [WorkSession] 
///
/// Data:
/// - batch_id: [u64] 
/// - timestamp: [i64] 
	pub fn process_payroll(ctx: Context<ProcessPayroll>, batch_id: u64, timestamp: i64) -> Result<()> {
		process_payroll::handler(ctx, batch_id, timestamp)
	}

/// Mark a work session as paid
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[writable]` work_session: [WorkSession] 
///
/// Data:
/// - employee_wallet: [Pubkey] 
/// - session_id: [u64] 
	pub fn mark_session_paid(ctx: Context<MarkSessionPaid>, employee_wallet: Pubkey, session_id: u64) -> Result<()> {
		mark_session_paid::handler(ctx, employee_wallet, session_id)
	}



}
