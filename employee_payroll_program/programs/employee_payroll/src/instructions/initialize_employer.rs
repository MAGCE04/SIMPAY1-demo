use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;



	#[derive(Accounts)]
	pub struct InitializeEmployer<'info> {
		pub authority: Signer<'info>,

		#[account(
			signer,
			init,
			space=8,
			payer=authority,
		)]
		/// CHECK: implement manual checks if needed
		pub employer: UncheckedAccount<'info>,

		pub system_program: Program<'info, System>,
	}

/// Initialize the employer account
///
/// Accounts:
/// 0. `[signer]` authority: [AccountInfo] 
/// 1. `[writable, signer]` employer: [AccountInfo] 
/// 2. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
pub fn handler(
	ctx: Context<InitializeEmployer>,
) -> Result<()> {
    // Implement your business logic here...
	
	Ok(())
}
