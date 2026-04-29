// lib.rs
// Rexy AI Auditor — On-Chain Audit Registry + Staked Certificates
// Anchor Program (Rust)
// Place this at: programs/rexy-registry/src/lib.rs

use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("REXYregistryXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"); // Replace after deploy

// ─── Constants ────────────────────────────────────────────────────────────────

/// Lamports staked per audit certificate (~0.1 SOL)
pub const STAKE_AMOUNT: u64 = 100_000_000;

/// Protection window: 90 days in seconds
pub const PROTECTION_WINDOW: i64 = 90 * 24 * 60 * 60;

/// Minimum score to be eligible for a certificate
pub const MIN_CERT_SCORE: u8 = 85;

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod rexy_registry {
    use super::*;

    /// Register an audit result on-chain.
    /// Auditor stakes STAKE_AMOUNT SOL as accountability bond.
    pub fn register_audit(
        ctx: Context<RegisterAudit>,
        program_id_audited: Pubkey,
        report_hash: [u8; 32],   // SHA-256 of the full audit report JSON
        score: u8,
        vulnerability_count: u16,
        critical_count: u8,
        high_count: u8,
    ) -> Result<()> {
        require!(score <= 100, RexyError::InvalidScore);

        let audit = &mut ctx.accounts.audit_record;
        let clock = Clock::get()?;

        audit.auditor = ctx.accounts.auditor.key();
        audit.program_id_audited = program_id_audited;
        audit.report_hash = report_hash;
        audit.score = score;
        audit.vulnerability_count = vulnerability_count;
        audit.critical_count = critical_count;
        audit.high_count = high_count;
        audit.timestamp = clock.unix_timestamp;
        audit.slot = clock.slot;
        audit.is_exploited = false;
        audit.stake_active = false;
        audit.bump = ctx.bumps.audit_record;

        emit!(AuditRegistered {
            auditor: audit.auditor,
            program_id_audited,
            score,
            timestamp: audit.timestamp,
            report_hash,
        });

        msg!(
            "Rexy Audit registered: program={} score={} slot={}",
            program_id_audited,
            score,
            clock.slot
        );

        Ok(())
    }

    /// Mint a staked certificate for audits scoring >= MIN_CERT_SCORE.
    /// Auditor locks STAKE_AMOUNT SOL for PROTECTION_WINDOW days.
    pub fn stake_certificate(ctx: Context<StakeCertificate>) -> Result<()> {
        let audit = &mut ctx.accounts.audit_record;

        require!(
            audit.score >= MIN_CERT_SCORE,
            RexyError::ScoreTooLowForCertificate
        );
        require!(!audit.stake_active, RexyError::AlreadyStaked);
        require!(
            audit.auditor == ctx.accounts.auditor.key(),
            RexyError::Unauthorized
        );

        // Transfer stake from auditor to the stake vault PDA
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.auditor.to_account_info(),
                to: ctx.accounts.stake_vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, STAKE_AMOUNT)?;

        let clock = Clock::get()?;
        audit.stake_active = true;
        audit.stake_amount = STAKE_AMOUNT;
        audit.stake_expires_at = clock.unix_timestamp + PROTECTION_WINDOW;

        emit!(CertificateStaked {
            auditor: audit.auditor,
            program_id_audited: audit.program_id_audited,
            stake_amount: STAKE_AMOUNT,
            expires_at: audit.stake_expires_at,
        });

        msg!(
            "Certificate staked: {} SOL locked until slot expiry",
            STAKE_AMOUNT / 1_000_000_000
        );

        Ok(())
    }

    /// Report an exploit on a staked audit within the protection window.
    /// On success, releases stake to the reporter as compensation.
    pub fn report_exploit(
        ctx: Context<ReportExploit>,
        exploit_tx_signature: String, // Proof: mainnet tx signature
    ) -> Result<()> {
        let audit = &mut ctx.accounts.audit_record;
        let clock = Clock::get()?;

        require!(audit.stake_active, RexyError::NoActiveStake);
        require!(!audit.is_exploited, RexyError::AlreadyReported);
        require!(
            clock.unix_timestamp <= audit.stake_expires_at,
            RexyError::StakeExpired
        );
        require!(
            exploit_tx_signature.len() > 0 && exploit_tx_signature.len() <= 128,
            RexyError::InvalidExploitProof
        );

        let vault_balance = ctx.accounts.stake_vault.lamports();

        // Release stake to the reporter
        **ctx
            .accounts
            .stake_vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= vault_balance;
        **ctx
            .accounts
            .reporter
            .to_account_info()
            .try_borrow_mut_lamports()? += vault_balance;

        audit.is_exploited = true;
        audit.stake_active = false;
        audit.exploit_reported_at = clock.unix_timestamp;

        emit!(ExploitReported {
            reporter: ctx.accounts.reporter.key(),
            program_id_audited: audit.program_id_audited,
            stake_released: vault_balance,
            exploit_tx: exploit_tx_signature,
        });

        msg!("Exploit reported. Stake released to reporter.");

        Ok(())
    }

    /// Auditor reclaims stake after protection window expires with no exploit.
    pub fn reclaim_stake(ctx: Context<ReclaimStake>) -> Result<()> {
        let audit = &mut ctx.accounts.audit_record;
        let clock = Clock::get()?;

        require!(audit.stake_active, RexyError::NoActiveStake);
        require!(
            clock.unix_timestamp > audit.stake_expires_at,
            RexyError::StakeNotExpired
        );
        require!(
            audit.auditor == ctx.accounts.auditor.key(),
            RexyError::Unauthorized
        );

        let vault_balance = ctx.accounts.stake_vault.lamports();

        **ctx
            .accounts
            .stake_vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= vault_balance;
        **ctx
            .accounts
            .auditor
            .to_account_info()
            .try_borrow_mut_lamports()? += vault_balance;

        audit.stake_active = false;

        emit!(StakeReclaimed {
            auditor: audit.auditor,
            amount: vault_balance,
        });

        msg!("Stake reclaimed by auditor after clean protection window.");

        Ok(())
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(program_id_audited: Pubkey)]
pub struct RegisterAudit<'info> {
    #[account(
        init,
        payer = auditor,
        space = AuditRecord::LEN,
        seeds = [b"audit", auditor.key().as_ref(), program_id_audited.as_ref()],
        bump
    )]
    pub audit_record: Account<'info, AuditRecord>,

    #[account(mut)]
    pub auditor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeCertificate<'info> {
    #[account(
        mut,
        seeds = [b"audit", auditor.key().as_ref(), audit_record.program_id_audited.as_ref()],
        bump = audit_record.bump
    )]
    pub audit_record: Account<'info, AuditRecord>,

    /// CHECK: PDA vault to hold staked SOL
    #[account(
        mut,
        seeds = [b"vault", audit_record.key().as_ref()],
        bump
    )]
    pub stake_vault: AccountInfo<'info>,

    #[account(mut)]
    pub auditor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReportExploit<'info> {
    #[account(
        mut,
        seeds = [b"audit", audit_record.auditor.as_ref(), audit_record.program_id_audited.as_ref()],
        bump = audit_record.bump
    )]
    pub audit_record: Account<'info, AuditRecord>,

    /// CHECK: PDA vault holding staked SOL
    #[account(
        mut,
        seeds = [b"vault", audit_record.key().as_ref()],
        bump
    )]
    pub stake_vault: AccountInfo<'info>,

    #[account(mut)]
    pub reporter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReclaimStake<'info> {
    #[account(
        mut,
        seeds = [b"audit", auditor.key().as_ref(), audit_record.program_id_audited.as_ref()],
        bump = audit_record.bump
    )]
    pub audit_record: Account<'info, AuditRecord>,

    /// CHECK: PDA vault
    #[account(
        mut,
        seeds = [b"vault", audit_record.key().as_ref()],
        bump
    )]
    pub stake_vault: AccountInfo<'info>,

    #[account(mut)]
    pub auditor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct AuditRecord {
    pub auditor: Pubkey,              // 32
    pub program_id_audited: Pubkey,   // 32
    pub report_hash: [u8; 32],        // 32  SHA-256 of report JSON
    pub score: u8,                    // 1
    pub vulnerability_count: u16,     // 2
    pub critical_count: u8,           // 1
    pub high_count: u8,               // 1
    pub timestamp: i64,               // 8
    pub slot: u64,                    // 8
    pub is_exploited: bool,           // 1
    pub stake_active: bool,           // 1
    pub stake_amount: u64,            // 8
    pub stake_expires_at: i64,        // 8
    pub exploit_reported_at: i64,     // 8
    pub bump: u8,                     // 1
}

impl AuditRecord {
    pub const LEN: usize = 8    // discriminator
        + 32 + 32 + 32          // pubkeys + hash
        + 1 + 2 + 1 + 1         // score, vuln counts
        + 8 + 8                 // timestamp, slot
        + 1 + 1 + 8 + 8 + 8    // flags + stake fields
        + 1;                    // bump
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct AuditRegistered {
    pub auditor: Pubkey,
    pub program_id_audited: Pubkey,
    pub score: u8,
    pub timestamp: i64,
    pub report_hash: [u8; 32],
}

#[event]
pub struct CertificateStaked {
    pub auditor: Pubkey,
    pub program_id_audited: Pubkey,
    pub stake_amount: u64,
    pub expires_at: i64,
}

#[event]
pub struct ExploitReported {
    pub reporter: Pubkey,
    pub program_id_audited: Pubkey,
    pub stake_released: u64,
    pub exploit_tx: String,
}

#[event]
pub struct StakeReclaimed {
    pub auditor: Pubkey,
    pub amount: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum RexyError {
    #[msg("Score must be between 0 and 100")]
    InvalidScore,
    #[msg("Score is below 85 — not eligible for staked certificate")]
    ScoreTooLowForCertificate,
    #[msg("Certificate is already staked")]
    AlreadyStaked,
    #[msg("No active stake on this audit")]
    NoActiveStake,
    #[msg("Exploit already reported for this audit")]
    AlreadyReported,
    #[msg("Protection window has expired")]
    StakeExpired,
    #[msg("Protection window has not yet expired")]
    StakeNotExpired,
    #[msg("Exploit proof signature is invalid or missing")]
    InvalidExploitProof,
    #[msg("Unauthorized: you are not the original auditor")]
    Unauthorized,
}
