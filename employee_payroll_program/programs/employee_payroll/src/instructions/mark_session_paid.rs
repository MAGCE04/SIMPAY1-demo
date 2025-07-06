use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;



	#[derive(Accounts)]
	#[instruction(
		employee_wallet: Pubkey,
		session_id: u64,
	)]
	pub struct MarkSessionPaid<'info> {
		pub authority: Signer<'info>,

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

/// Mark a work session as paid
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[writable]` work_session: [WorkSession] 
///
/// Data:
/// - employee_wallet: [Pubkey] 
/// - session_id: [u64] 
pub fn handler(
	ctx: Context<MarkSessionPaid>,
	employee_wallet: Pubkey,
	session_id: u64,
) -> Result<()> {
    // Implement your business logic here...
	
	Ok(())
}
