use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;



	#[derive(Accounts)]
	#[instruction(
		name: String,
		position: String,
		hourly_rate: u64,
		employee_wallet: Pubkey,
	)]
	pub struct RegisterEmployee<'info> {
		pub authority: Signer<'info>,

		#[account(
			init,
			space=205,
			payer=authority,
			seeds = [
				b"employee",
				employee_wallet.as_ref(),
			],
			bump,
		)]
		pub employee: Account<'info, Employee>,

		pub system_program: Program<'info, System>,
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
pub fn handler(
	ctx: Context<RegisterEmployee>,
	name: String,
	position: String,
	hourly_rate: u64,
	employee_wallet: Pubkey,
) -> Result<()> {
    // Implement your business logic here...
	
	Ok(())
}
