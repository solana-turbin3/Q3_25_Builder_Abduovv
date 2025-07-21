use borsh::{BorshDeserialize, BorshSerialize};
use trident_fuzz::fuzzing::*;
/// File containing all custom types which can be used
/// in transactions and instructions or invariant checks.
///
/// You can define your own custom types here.
#[derive(Arbitrary, Debug, BorshDeserialize, BorshSerialize, Clone)]
pub struct Config {
    seed: u64,
    authority: Option<TridentPubkey>,
    mint_x: TridentPubkey,
    mint_y: TridentPubkey,
    fee: u16,
    locked: bool,
    config_bump: u8,
    lp_bump: u8,
}
#[derive(Arbitrary, Debug, BorshDeserialize, BorshSerialize, Clone)]
pub struct SwapEvent {
    user: TridentPubkey,
    amount_in: u64,
    amount_out: u64,
    x_to_y: bool,
    reserve_x: u64,
    reserve_y: u64,
}
