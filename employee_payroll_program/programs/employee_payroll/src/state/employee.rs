
use anchor_lang::prelude::*;

#[account]
pub struct Employee {
	pub name: String,
	pub position: String,
	pub hourly_rate: u64,
	pub total_hours_worked: u64,
	pub total_paid: u64,
	pub authority: Pubkey,
	pub employee_wallet: Pubkey,
	pub is_active: bool,
}
