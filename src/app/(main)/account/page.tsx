"use client";

import { useState } from "react";
import {
  Wallet,
  Shield,
  Lock,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle,
  Clock,
  Key,
  Smartphone,
  LogOut,
  ExternalLink,
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  type: "Deposit" | "Withdraw" | "Trade";
  amount: number;
  status: "Completed" | "Pending" | "Failed";
}

const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    date: "2025-12-01",
    type: "Deposit",
    amount: 5000,
    status: "Completed",
  },
  {
    id: "tx-2",
    date: "2025-11-28",
    type: "Trade",
    amount: -450,
    status: "Completed",
  },
  {
    id: "tx-3",
    date: "2025-11-25",
    type: "Trade",
    amount: 1230,
    status: "Completed",
  },
  {
    id: "tx-4",
    date: "2025-11-20",
    type: "Deposit",
    amount: 10000,
    status: "Completed",
  },
  {
    id: "tx-5",
    date: "2025-11-15",
    type: "Withdraw",
    amount: -2000,
    status: "Completed",
  },
  {
    id: "tx-6",
    date: "2025-11-10",
    type: "Trade",
    amount: 876,
    status: "Completed",
  },
  {
    id: "tx-7",
    date: "2025-11-05",
    type: "Deposit",
    amount: 7500,
    status: "Pending",
  },
];

export default function AccountPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("usdc");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const availableBalance = 12500;
  const inCopyTrades = 20000;
  const totalValue = availableBalance + inCopyTrades;

  return (
    <div className="space-y-8">
      {/* Connection Section */}
      <div className="rounded-2xl bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-inset text-blue-400">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Account Connection
            </h2>
            <p className="text-sm text-muted">
              Connect your Polymarket account to start copy trading
            </p>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Polymarket API Key or Wallet Address
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Enter your API key or 0x... wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="h-11 w-full rounded-xl border border-card-border pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            <button
              onClick={() => walletAddress.trim() && setIsConnected(true)}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              Connect Account
            </button>

            {/* Create Account Flow */}
            <div className="rounded-xl bg-surface-inset p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                New to Polymarket? Create an Account
              </h3>
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: "Visit Polymarket",
                    desc: "Go to polymarket.com and sign up",
                  },
                  {
                    step: 2,
                    title: "Verify Your Identity",
                    desc: "Complete KYC verification process",
                  },
                  {
                    step: 3,
                    title: "Fund Your Account",
                    desc: "Deposit USDC to your Polymarket wallet",
                  },
                  {
                    step: 4,
                    title: "Get API Key",
                    desc: "Generate an API key from account settings",
                  },
                  {
                    step: 5,
                    title: "Connect Here",
                    desc: "Paste your API key above to start copy trading",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-blue-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:underline"
              >
                Go to Polymarket
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-surface-inset p-4">
            <CheckCircle className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Account Connected
              </p>
              <p className="text-xs text-blue-400">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              </p>
            </div>
            <button
              onClick={() => setIsConnected(false)}
              className="ml-auto text-xs font-medium text-blue-400 hover:underline"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Wallet className="h-4 w-4" />
            Available Balance
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            ${availableBalance.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted">
            <ArrowUpFromLine className="h-4 w-4" />
            In Copy Trades
          </div>
          <p className="mt-2 text-2xl font-bold text-gold-500">
            ${inCopyTrades.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Shield className="h-4 w-4" />
            Total Value
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            ${totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Deposit & Withdraw */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Deposit */}
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
            <ArrowDownToLine className="h-5 w-5 text-blue-400" />
            Deposit
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-11 w-full rounded-xl border border-card-border pl-7 pr-4 text-sm text-foreground outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Payment Method
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod("usdc")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                    paymentMethod === "usdc"
                      ? "border-blue-500 bg-surface-inset text-blue-400"
                      : "border-card-border text-muted hover:bg-surface-inset"
                  }`}
                >
                  <span className="text-base">$</span>
                  USDC
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                    paymentMethod === "card"
                      ? "border-blue-500 bg-surface-inset text-blue-400"
                      : "border-card-border text-muted hover:bg-surface-inset"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
              </div>
            </div>

            <button className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800">
              Deposit
            </button>
          </div>
        </div>

        {/* Withdraw */}
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
            <ArrowUpFromLine className="h-5 w-5 text-blue-400" />
            Withdraw
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  $
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="h-11 w-full rounded-xl border border-card-border pl-7 pr-4 text-sm text-foreground outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Destination Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="h-11 w-full rounded-xl border border-card-border px-4 text-sm text-foreground placeholder-muted outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <button className="w-full rounded-xl border border-card-border bg-surface py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-inset">
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-foreground">
          Transaction History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs font-medium uppercase tracking-wider text-muted">
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {mockTransactions.map((tx) => (
                <tr key={tx.id} className="text-foreground">
                  <td className="py-3 pr-4 text-muted">
                    {new Date(tx.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tx.type === "Deposit"
                          ? "bg-surface-inset text-blue-400"
                          : tx.type === "Withdraw"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {tx.type === "Deposit" && (
                        <ArrowDownToLine className="h-3 w-3" />
                      )}
                      {tx.type === "Withdraw" && (
                        <ArrowUpFromLine className="h-3 w-3" />
                      )}
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className={`py-3 pr-4 font-semibold ${
                      tx.amount >= 0 ? "text-gold-500" : "text-danger"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}${Math.abs(tx.amount).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        tx.status === "Completed"
                          ? "text-blue-400"
                          : tx.status === "Pending"
                            ? "text-amber-600"
                            : "text-danger"
                      }`}
                    >
                      {tx.status === "Completed" && (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      {tx.status === "Pending" && (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-2xl bg-surface p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
          <Lock className="h-5 w-5 text-blue-400" />
          Security
        </h2>
        <div className="space-y-4">
          {/* 2FA Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-surface-inset p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-inset text-blue-400">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-muted">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <button
              onClick={() => setTwoFAEnabled(!twoFAEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                twoFAEnabled ? "bg-blue-600" : "bg-toggle-off"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  twoFAEnabled ? "translate-x-5" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </div>

          {/* Session Management */}
          <div className="flex items-center justify-between rounded-xl bg-surface-inset p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-inset text-blue-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Active Sessions
                </p>
                <p className="text-xs text-muted">
                  1 active session on this device
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
