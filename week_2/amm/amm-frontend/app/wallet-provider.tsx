"use client";
import { ReactNode } from "react";
import WalletContextProvider from "../components/WalletContextProvider";

export default function WalletProvider({ children }: { children: ReactNode }) {
  return <WalletContextProvider>{children}</WalletContextProvider>;
} 