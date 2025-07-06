
use anchor_lang::prelude::*;

#[account]
pub struct PayrollBatch {
	pub batch_id: u64,
	pub total_amount: u64,
	pub created_at: i64,
	pub processed_at: i64,
	pub is_processed: bool,
	pub authority: Pubkey,
}
