use {
	employee_payroll::{
			entry,
			ID as PROGRAM_ID,
	},
	solana_sdk::{
		entrypoint::{ProcessInstruction, ProgramResult},
		pubkey::Pubkey,
	},
	anchor_lang::prelude::AccountInfo,
	solana_program_test::*,
};

// Type alias for the entry function pointer used to convert the entry function into a ProcessInstruction function pointer.
pub type ProgramEntry = for<'info> fn(
	program_id: &Pubkey,
	accounts: &'info [AccountInfo<'info>],
	instruction_data: &[u8],
) -> ProgramResult;

// Macro to convert the entry function into a ProcessInstruction function pointer.
#[macro_export]
macro_rules! convert_entry {
	($entry:expr) => {
		// Use unsafe block to perform memory transmutation.
		unsafe { core::mem::transmute::<ProgramEntry, ProcessInstruction>($entry) }
	};
}

pub fn get_program_test() -> ProgramTest {
	let program_test = ProgramTest::new(
		"employee_payroll",
		PROGRAM_ID,
		processor!(convert_entry!(entry)),
	);
	program_test
}
	
pub mod employee_payroll_ix_interface {

	use {
		solana_sdk::{
			hash::Hash,
			signature::{Keypair, Signer},
			instruction::Instruction,
			pubkey::Pubkey,
			transaction::Transaction,
		},
		employee_payroll::{
			ID as PROGRAM_ID,
			accounts as employee_payroll_accounts,
			instruction as employee_payroll_instruction,
		},
		anchor_lang::{
			prelude::*,
			InstructionData,
		}
	};

	pub fn initialize_employer_ix_setup(
		authority: &Keypair,
		employer: &Keypair,
		system_program: Pubkey,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = employee_payroll_accounts::InitializeEmployer {
			authority: authority.pubkey(),
			employer: employer.pubkey(),
			system_program: system_program,
		};

		let data = employee_payroll_instruction::InitializeEmployer;
		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&authority.pubkey()),
		);

		transaction.sign(&[
			&authority,
			&employer,
		], recent_blockhash);

		return transaction;
	}

	pub fn register_employee_ix_setup(
		authority: &Keypair,
		employee: Pubkey,
		system_program: Pubkey,
		name: &String,
		position: &String,
		hourly_rate: u64,
		employee_wallet: Pubkey,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = employee_payroll_accounts::RegisterEmployee {
			authority: authority.pubkey(),
			employee: employee,
			system_program: system_program,
		};

		let data = 	employee_payroll_instruction::RegisterEmployee {
				name: name.clone(),
				position: position.clone(),
				hourly_rate,
				employee_wallet,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&authority.pubkey()),
		);

		transaction.sign(&[
			&authority,
		], recent_blockhash);

		return transaction;
	}

	pub fn update_employee_ix_setup(
		authority: &Keypair,
		employee: Pubkey,
		name: &String,
		position: &String,
		hourly_rate: u64,
		is_active: bool,
		employee_wallet: Pubkey,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = employee_payroll_accounts::UpdateEmployee {
			authority: authority.pubkey(),
			employee: employee,
		};

		let data = 	employee_payroll_instruction::UpdateEmployee {
				name: name.clone(),
				position: position.clone(),
				hourly_rate,
				is_active,
				employee_wallet,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&authority.pubkey()),
		);

		transaction.sign(&[
			&authority,
		], recent_blockhash);

		return transaction;
	}

	pub fn check_in_ix_setup(
		authority: &Keypair,
		employee: Pubkey,
		work_session: Pubkey,
		system_program: Pubkey,
		employee_wallet: Pubkey,
		session_id: u64,
		timestamp: i64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = employee_payroll_accounts::CheckIn {
			authority: authority.pubkey(),
			employee: employee,
			work_session: work_session,
			system_program: system_program,
		};

		let data = 	employee_payroll_instruction::CheckIn {
				employee_wallet,
				session_id,
				timestamp,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&authority.pubkey()),
		);

		transaction.sign(&[
			&authority,
		], recent_blockhash);

		return transaction;
	}

	pub fn check_out_ix_setup(
		authority: &Keypair,
		employee: Pubkey,
		work_session: Pubkey,
		employee_wallet: Pubkey,
		session_id: u64,
		timestamp: i64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = employee_payroll_accounts::CheckOut {
			authority: authority.pubkey(),
			employee: employee,
			work_session: work_session,
		};

		let data = 	employee_payroll_instruction::CheckOut {
				employee_wallet,
				session_id,
				timestamp,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&authority.pubkey()),
		);

		transaction.sign(&[
			&authority,
		], recent_blockhash);

		return transaction;
	}

	pub fn create_payroll_batch_ix_setup(
		authority: &Keypair,
		payroll_batch: Pubkey,
		system_program: Pubkey,
		batch_id: u64,
		timestamp: i64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = employee_payroll_accounts::CreatePayrollBatch {
			authority: authority.pubkey(),
			payroll_batch: payroll_batch,
			system_program: system_program,
		};

		let data = 	employee_payroll_instruction::CreatePayrollBatch {
				batch_id,
				timestamp,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&authority.pubkey()),
		);

		transaction.sign(&[
			&authority,
		], recent_blockhash);

		return transaction;
	}

	pub fn process_payroll_ix_setup(
		authority: &Keypair,
		payroll_batch: Pubkey,
		employee: Pubkey,
		work_session: Pubkey,
		batch_id: u64,
		timestamp: i64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = employee_payroll_accounts::ProcessPayroll {
			authority: authority.pubkey(),
			payroll_batch: payroll_batch,
			employee: employee,
			work_session: work_session,
		};

		let data = 	employee_payroll_instruction::ProcessPayroll {
				batch_id,
				timestamp,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&authority.pubkey()),
		);

		transaction.sign(&[
			&authority,
		], recent_blockhash);

		return transaction;
	}

	pub fn mark_session_paid_ix_setup(
		authority: &Keypair,
		work_session: Pubkey,
		employee_wallet: Pubkey,
		session_id: u64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = employee_payroll_accounts::MarkSessionPaid {
			authority: authority.pubkey(),
			work_session: work_session,
		};

		let data = 	employee_payroll_instruction::MarkSessionPaid {
				employee_wallet,
				session_id,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&authority.pubkey()),
		);

		transaction.sign(&[
			&authority,
		], recent_blockhash);

		return transaction;
	}

}
