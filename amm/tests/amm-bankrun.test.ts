import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import idl from "../target/idl/amm.json" assert { type: "json" };
import { PublicKey } from "@solana/web3.js";

describe("amm bankrun", () => {
  it("should load the program", async () => {
    const context = await startAnchor(".", [], []);
    const provider = new BankrunProvider(context);
    const programId = new PublicKey("2HF8oxRi9zuJo3J3CCqgXvKzUrjLXSzu6xa5qPMq1ksg");
    const program = new Program(idl as any, programId, provider);

    // ممكن هنا تعمل call لـ initialize مثلًا
    assert.isTrue(program.programId.equals(programId));
  });
});

