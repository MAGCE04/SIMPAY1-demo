pub mod common;

use std::str::FromStr;
use {
    common::{
		get_program_test,
		employee_payroll_ix_interface,
	},
    solana_program_test::tokio,
    solana_sdk::{
        account::Account, pubkey::Pubkey, rent::Rent, signature::Keypair, signer::Signer, system_program,
    },
};


#[tokio::test]
async fn update_employee_ix_success() {
	let mut program_test = get_program_test();

	// PROGRAMS
	program_test.prefer_bpf(true);

	program_test.add_program(
		"account_compression",
		Pubkey::from_str("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK").unwrap(),
		None,
	);

	program_test.add_program(
		"noop",
		Pubkey::from_str("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV").unwrap(),
		None,
	);

	// DATA
	let name: String = Default::default();
	let position: String = Default::default();
	let hourly_rate: u64 = Default::default();
	let is_active: bool = Default::default();
	let employee_wallet: Pubkey = Pubkey::default();

	// KEYPAIR
	let authority_keypair = Keypair::new();

	// PUBKEY
	let authority_pubkey = authority_keypair.pubkey();

	// PDA
	let (employee_pda, _employee_pda_bump) = Pubkey::find_program_address(
		&[
			b"employee",
			employee_wallet.as_ref(),
		],
		&employee_payroll::ID,
	);

	// ACCOUNT PROGRAM TEST SETUP
	program_test.add_account(
		authority_pubkey,
		Account {
			lamports: 1_000_000_000_000,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	// INSTRUCTIONS
	let (mut banks_client, _, recent_blockhash) = program_test.start().await;

	let ix = employee_payroll_ix_interface::update_employee_ix_setup(
		&authority_keypair,
		employee_pda,
		&name,
		&position,
		hourly_rate,
		is_active,
		employee_wallet,
		recent_blockhash,
	);

	let result = banks_client.process_transaction(ix).await;

	// ASSERTIONS
	assert!(result.is_ok());

}
