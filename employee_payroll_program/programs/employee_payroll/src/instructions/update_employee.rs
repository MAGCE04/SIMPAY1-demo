use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;



	#[derive(Accounts)]
	#[instruction(
		name: String,
		position: String,
		hourly_rate: u64,
		is_active: bool,
		employee_wallet: Pubkey,
	)]
	pub struct UpdateEmployee<'info> {
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
pub fn handler(
	ctx: Context<UpdateEmployee>,
	name: String,
	position: String,
	hourly_rate: u64,
	is_active: bool,
	employee_wallet: Pubkey,
) -> Result<()> {
    // Implement your business logic here...
	
	Ok(())
}
