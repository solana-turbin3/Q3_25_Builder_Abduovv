import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import type { Amm } from "../../target/types/amm";
import idl from "../idl/amm.json";
import { Connection } from "@solana/web3.js";

export const PROGRAM_ID = new web3.PublicKey("BDHWofSWX2ap9CHYiANE2h7XrYNrkYDnSJ5LT8SR5zrV");

export function getAmmProgram(connection: Connection, wallet: any): Program<Amm> {
  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "processed" });
  return new Program(idl as unknown as Amm, provider) as Program<Amm>;
} 