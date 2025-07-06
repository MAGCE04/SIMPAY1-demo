use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;



	#[derive(Accounts)]
	#[instruction(
		employee_wallet: Pubkey,
		session_id: u64,
		timestamp: i64,
	)]
	pub struct CheckIn<'info> {
		pub authority: Signer<'info>,

		#[account(
			seeds = [
				b"employee",
				employee_wallet.as_ref(),
			],
			bump,
		)]
		pub employee: Account<'info, Employee>,

		#[account(
			init,
			space=105,
			payer=authority,
			seeds = [
				b"work_session",
				employee_wallet.as_ref(),
				session_id.to_le_bytes().as_ref(),
			],
			bump,
		)]
		pub work_session: Account<'info, WorkSession>,

		pub system_program: Program<'info, System>,
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
pub fn handler(
	ctx: Context<CheckIn>,
	employee_wallet: Pubkey,
	session_id: u64,
	timestamp: i64,
) -> Result<()> {
    // Implement your business logic here...
	
	Ok(())
}
