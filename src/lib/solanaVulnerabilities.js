// solanaVulnerabilities.js
// Rexy AI Auditor — Solana-Specific Vulnerability Library
// Drop this into src/lib/solanaVulnerabilities.js

export const SOLANA_VULNERABILITIES = [
  {
    id: "SOL-001",
    name: "Missing Signer Check",
    severity: "Critical",
    category: "Access Control",
    description:
      "Instructions that modify state do not verify the transaction signer, allowing any caller to execute privileged operations.",
    patterns: [
      "ctx.accounts",
      "has_one",
      "constraint",
      "Signer",
      "#[account(signer)]",
    ],
    negativePatterns: ["ctx.accounts.authority.is_signer"],
    rustIndicators: [
      "pub authority: AccountInfo",
      "pub authority: UncheckedAccount",
    ],
    remediation:
      'Use `Signer<\'info>` type or add `#[account(signer)]` constraint to enforce signer verification.',
    patchExample: {
      vulnerable: `pub authority: AccountInfo<'info>,`,
      secure: `pub authority: Signer<'info>,`,
    },
    references: [
      "https://docs.solanalabs.com/developers/security",
      "https://github.com/coral-xyz/sealevel-attacks",
    ],
    cvssScore: 9.8,
    pointDeduction: 25,
  },
  {
    id: "SOL-002",
    name: "Missing Owner Check",
    severity: "Critical",
    category: "Account Validation",
    description:
      "Program fails to verify the owner of an account, allowing an attacker to pass in a malicious account owned by a different program.",
    patterns: ["AccountInfo", "account.owner"],
    negativePatterns: [
      "account.owner == program_id",
      "Account<",
      "#[account(",
    ],
    rustIndicators: [
      "AccountInfo<'info>",
      "account.to_account_info().owner",
    ],
    remediation:
      "Use Anchor's `Account<'info, T>` wrapper which automatically validates account ownership, or manually check `account.owner == expected_program_id`.",
    patchExample: {
      vulnerable: `pub vault: AccountInfo<'info>,`,
      secure: `pub vault: Account<'info, VaultState>,`,
    },
    references: ["https://github.com/coral-xyz/sealevel-attacks"],
    cvssScore: 9.1,
    pointDeduction: 25,
  },
  {
    id: "SOL-003",
    name: "Arithmetic Overflow / Underflow",
    severity: "High",
    category: "Numeric Safety",
    description:
      "Rust integer operations can panic or wrap silently. In Solana programs running without overflow checks in release mode, this leads to incorrect balances or silent data corruption.",
    patterns: ["u64", "u128", "i64", "amount +", "amount -", "* fee"],
    negativePatterns: [
      "checked_add",
      "checked_sub",
      "checked_mul",
      "checked_div",
      "saturating_add",
    ],
    rustIndicators: ["u64::MAX", "overflow", "wrapping_add"],
    remediation:
      "Replace all arithmetic operations with their checked variants: `checked_add()`, `checked_sub()`, `checked_mul()`. Return an error on `None`.",
    patchExample: {
      vulnerable: `let new_amount = user.balance + deposit_amount;`,
      secure: `let new_amount = user.balance.checked_add(deposit_amount).ok_or(ErrorCode::Overflow)?;`,
    },
    references: [
      "https://doc.rust-lang.org/std/primitive.u64.html#method.checked_add",
    ],
    cvssScore: 7.5,
    pointDeduction: 15,
  },
  {
    id: "SOL-004",
    name: "Cross-Program Invocation (CPI) Vulnerability",
    severity: "High",
    category: "CPI Security",
    description:
      "Unsafe CPI calls that pass unvalidated accounts to external programs, potentially allowing privilege escalation or reentrancy-like attacks.",
    patterns: ["invoke(", "invoke_signed(", "CpiContext::new"],
    negativePatterns: ["Program<'info,", "program.key() =="],
    rustIndicators: ["invoke(&instruction", "invoke_signed(&instruction"],
    remediation:
      "Use Anchor's `CpiContext` with typed program accounts. Validate the program key before invoking. Never pass `AccountInfo` directly without ownership checks.",
    patchExample: {
      vulnerable: `invoke(&transfer_ix, &[from.clone(), to.clone()])?;`,
      secure: `let cpi_ctx = CpiContext::new(token_program.to_account_info(), transfer_accounts);
token::transfer(cpi_ctx, amount)?;`,
    },
    references: [
      "https://docs.solanalabs.com/developers/security#cross-program-invocations",
    ],
    cvssScore: 8.0,
    pointDeduction: 20,
  },
  {
    id: "SOL-005",
    name: "Account Data Reloading After CPI",
    severity: "Medium",
    category: "State Management",
    description:
      "After a CPI call modifies account data, the local cached version may be stale. Reading stale data after CPI leads to logic errors similar to reentrancy vulnerabilities.",
    patterns: ["invoke(", "invoke_signed("],
    negativePatterns: ["reload()", "account.reload()"],
    rustIndicators: ["ctx.accounts.vault", "after invoke"],
    remediation:
      "Call `account.reload()?` after any CPI that modifies the account's data to refresh the local cache.",
    patchExample: {
      vulnerable: `invoke_signed(&ix, accounts, seeds)?;
let balance = ctx.accounts.vault.amount; // stale!`,
      secure: `invoke_signed(&ix, accounts, seeds)?;
ctx.accounts.vault.reload()?;
let balance = ctx.accounts.vault.amount; // fresh`,
    },
    references: ["https://github.com/coral-xyz/anchor/issues/1592"],
    cvssScore: 6.5,
    pointDeduction: 10,
  },
  {
    id: "SOL-006",
    name: "Missing Rent Exemption Check",
    severity: "Medium",
    category: "Account Lifecycle",
    description:
      "Accounts not holding enough SOL to be rent-exempt can be garbage collected by the runtime, causing unexpected program failures and loss of state.",
    patterns: ["create_account", "allocate", "lamports"],
    negativePatterns: [
      "rent.is_exempt",
      "Rent::get()",
      "rent_exempt_minimum",
    ],
    rustIndicators: ["system_instruction::create_account", "lamports: 0"],
    remediation:
      "Always calculate the minimum balance for rent exemption using `Rent::get()?.minimum_balance(space)` and fund accounts accordingly.",
    patchExample: {
      vulnerable: `lamports: 1000,`,
      secure: `lamports: Rent::get()?.minimum_balance(MyAccount::LEN),`,
    },
    references: ["https://docs.solanalabs.com/implemented-proposals/rent"],
    cvssScore: 5.5,
    pointDeduction: 8,
  },
  {
    id: "SOL-007",
    name: "Sysvar Account Spoofing",
    severity: "High",
    category: "Account Validation",
    description:
      "Program accepts sysvar accounts (Clock, Rent, etc.) via `AccountInfo` without validating their public key, allowing attackers to pass fake sysvar data.",
    patterns: ["AccountInfo", "Clock", "Rent", "EpochSchedule"],
    negativePatterns: ["Sysvar<", "Clock::get()", "Rent::get()"],
    rustIndicators: [
      "pub clock: AccountInfo<'info>",
      "Clock::from_account_info",
    ],
    remediation:
      "Use the `Sysvar<'info, T>` wrapper or call `Clock::get()?` directly instead of accepting sysvars as account parameters.",
    patchExample: {
      vulnerable: `pub clock: AccountInfo<'info>,`,
      secure: `pub clock: Sysvar<'info, Clock>,`,
    },
    references: [
      "https://docs.rs/solana-program/latest/solana_program/sysvar/index.html",
    ],
    cvssScore: 7.8,
    pointDeduction: 18,
  },
  {
    id: "SOL-008",
    name: "Duplicate Mutable Accounts",
    severity: "High",
    category: "Account Validation",
    description:
      "When two instruction accounts reference the same public key and both are mutable, writes to one corrupt the other's state, leading to double-spend or state manipulation.",
    patterns: ["mut", "AccountInfo", "transfer", "debit", "credit"],
    negativePatterns: [
      "constraint = from.key() != to.key()",
      "require_keys_neq!",
    ],
    rustIndicators: ["#[account(mut)]", "pub from:", "pub to:"],
    remediation:
      "Add a constraint to ensure mutable accounts are distinct: `#[account(mut, constraint = from.key() != to.key() @ ErrorCode::SameAccount)]`",
    patchExample: {
      vulnerable: `#[account(mut)]
pub from: Account<'info, TokenAccount>,
#[account(mut)]
pub to: Account<'info, TokenAccount>,`,
      secure: `#[account(mut, constraint = from.key() != to.key() @ ErrorCode::SameAccount)]
pub from: Account<'info, TokenAccount>,
#[account(mut)]
pub to: Account<'info, TokenAccount>,`,
    },
    references: ["https://github.com/coral-xyz/sealevel-attacks"],
    cvssScore: 8.3,
    pointDeduction: 20,
  },
  {
    id: "SOL-009",
    name: "Unchecked Account Discriminator",
    severity: "Medium",
    category: "Account Validation",
    description:
      "Using `AccountInfo` or `UncheckedAccount` without verifying the account discriminator allows type confusion attacks where wrong account types are substituted.",
    patterns: ["UncheckedAccount", "AccountInfo", "/// CHECK:"],
    negativePatterns: ["Account<'info,", "discriminator"],
    rustIndicators: [
      "pub pool: UncheckedAccount<'info>",
      "pub state: AccountInfo<'info>",
    ],
    remediation:
      "Use Anchor's typed `Account<'info, T>` which validates the 8-byte discriminator automatically. If `UncheckedAccount` is required, add a `/// CHECK:` comment explaining safety and manually verify.",
    patchExample: {
      vulnerable: `/// CHECK: skip
pub pool: UncheckedAccount<'info>,`,
      secure: `pub pool: Account<'info, PoolState>,`,
    },
    references: ["https://www.anchor-lang.com/docs/account-types"],
    cvssScore: 6.0,
    pointDeduction: 10,
  },
  {
    id: "SOL-010",
    name: "Insecure Program Upgrade Authority",
    severity: "Critical",
    category: "Governance",
    description:
      "Program upgrade authority held by a single EOA (externally owned account) instead of a multisig or governance program, creating a centralization risk and potential rug vector.",
    patterns: ["upgrade_authority", "BPFLoader", "set_upgrade_authority"],
    negativePatterns: ["multisig", "timelock", "governance"],
    rustIndicators: ["upgrade_authority_address", "UpgradeableLoaderState"],
    remediation:
      "Transfer upgrade authority to a multisig (e.g., Squads Protocol) or a on-chain governance program. Consider making the program immutable if no upgrades are planned.",
    patchExample: {
      vulnerable: `// upgrade authority: single keypair wallet`,
      secure: `// upgrade authority: Squads multisig requiring 3/5 signers`,
    },
    references: ["https://squads.so/blog/solana-multisig-program-authority"],
    cvssScore: 9.5,
    pointDeduction: 25,
  },
];

// ─── Scoring Engine ───────────────────────────────────────────────────────────

/**
 * Analyzes code string against the vulnerability library.
 * Returns matched vulnerabilities and a deducted score.
 */
export function analyzeWithVulnLibrary(code, baseScore = 100) {
  const findings = [];

  for (const vuln of SOLANA_VULNERABILITIES) {
    const hasPattern = vuln.patterns.some((p) => code.includes(p));
    const hasFix = vuln.negativePatterns.some((p) => code.includes(p));
    const hasRustIndicator =
      vuln.rustIndicators?.some((p) => code.includes(p)) ?? false;

    if ((hasPattern || hasRustIndicator) && !hasFix) {
      findings.push({
        ...vuln,
        detected: true,
        confidence: hasRustIndicator ? "High" : "Medium",
      });
    }
  }

  const totalDeduction = findings.reduce(
    (sum, f) => sum + f.pointDeduction,
    0
  );
  const finalScore = Math.max(0, baseScore - totalDeduction);

  const summary = {
    score: finalScore,
    totalDeduction,
    critical: findings.filter((f) => f.severity === "Critical").length,
    high: findings.filter((f) => f.severity === "High").length,
    medium: findings.filter((f) => f.severity === "Medium").length,
    low: findings.filter((f) => f.severity === "Low").length,
    findings,
  };

  return summary;
}

/**
 * Returns a severity color for UI rendering.
 */
export function getSeverityColor(severity) {
  const colors = {
    Critical: "#FF3B30",
    High: "#FF9500",
    Medium: "#FFCC00",
    Low: "#34C759",
    Info: "#007AFF",
  };
  return colors[severity] ?? "#8E8E93";
}

/**
 * Returns all vulnerabilities filtered by severity.
 */
export function getVulnsBySeverity(severity) {
  return SOLANA_VULNERABILITIES.filter((v) => v.severity === severity);
}
