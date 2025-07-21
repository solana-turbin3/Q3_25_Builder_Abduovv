use anchor_lang::prelude::*;
use solana_program::instruction::Instruction;
use solana_sdk::{signer::{keypair::Keypair, Signer}, transaction::Transaction};
use litesvm::{LiteSVM, types::TransactionResult};
use vault::instruction::*;

#[test]
fn test_init() {
    let svm = LiteSVM::new().unwrap();
    svm.add_program(vault::ID, include_bytes!("../target/deploy/vault.so")).unwrap();

    let user = Keypair::new();
    let accounts = vault::accounts::Initialize {
        signer: user.pubkey(),
        vault_state: Pubkey::new_unique(),
        vault: Pubkey::new_unique(),
    };

    let instruction = Instruction::new_with_borsh(
        vault::id(),
        &Initialize,
        accounts.try_to_vec().unwrap(),
    );

    let tx = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&user.pubkey()),
        &[&user],
        svm.get_recent_blockhash().unwrap(),
    );

    let result = svm.process_transaction(&tx).unwrap();
    assert_eq!(result, TransactionResult::Ok);
}
