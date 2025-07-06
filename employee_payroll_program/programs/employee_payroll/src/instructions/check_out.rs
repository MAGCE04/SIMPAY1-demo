use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;



	#[derive(Accounts)]
	#[instruction(
		employee_wallet: Pubkey,
		session_id: u64,
		timestamp: i64,
	)]
	pub struct CheckOut<'info> {
		pub authority: Signer<'info>,

		#[account(
			mut,
			seeds = [
				b"employee",
				employee_wallet.as_ref(),
			],
			bump,
		)]
		pub employee: Account<'info, Employee>,

		#[account(
			mut,
			seeds = [
				b"work_session",
				employee_wallet.as_ref(),
				session_id.to_le_bytes().as_ref(),
			],
			bump,
		)]
		pub work_session: Account<'info, WorkSession>,
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
pub fn handler(
	ctx: Context<CheckOut>,
	employee_wallet: Pubkey,
	session_id: u64,
	timestamp: i64,
) -> Result<()> {
    // Implement your business logic here...
	
	Ok(())
}
