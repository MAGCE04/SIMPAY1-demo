
use anchor_lang::prelude::*;

#[account]
pub struct WorkSession {
	pub employee: Pubkey,
	pub check_in_time: i64,
	pub check_out_time: i64,
	pub duration: u64,
	pub is_paid: bool,
	pub authority: Pubkey,
	pub session_id: u64,
}
