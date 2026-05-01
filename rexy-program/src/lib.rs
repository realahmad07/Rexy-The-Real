use anchor_lang::prelude::*;

declare_id!("B8aYqxvVNhD6HBbngaKspQRoZEAf5PpjhTH6Vpw5j1xq");

#[program]
pub mod rexy_registry {
    use super::*;

    pub fn register_audit(
        ctx: Context<RegisterAudit>,
        program_id_audited: String,
        score: u8,
        report_hash: [u8; 32],
        audit_date: i64,
        critical_count: u8,
        high_count: u8,
    ) -> Result<()> {
        let audit_record = &mut ctx.accounts.audit_record;
        
        audit_record.auditor = *ctx.accounts.auditor.key;
        audit_record.program_id_audited = program_id_audited;
        audit_record.score = score;
        audit_record.report_hash = report_hash;
        audit_record.audit_date = audit_date;
        audit_record.critical_count = critical_count;
        audit_record.high_count = high_count;
        audit_record.is_staked = false;
        
        Ok(())
    }

    pub fn stake_certificate(ctx: Context<StakeCertificate>) -> Result<()> {
        let audit_record = &mut ctx.accounts.audit_record;
        
        // Transfer 0.001 SOL from auditor to the stake vault
        let stake_amount: u64 = 1_000_000; // 0.001 SOL (1e9 / 1000)
        
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.auditor.to_account_info(),
                to: ctx.accounts.stake_vault.to_account_info(),
            },
        );
        
        anchor_lang::system_program::transfer(cpi_context, stake_amount)?;

        audit_record.is_staked = true;
        
        Ok(())
    }

    pub fn report_exploit(
        ctx: Context<ReportExploit>,
        _tx_id: String,
        _exploit_date: i64,
        _amount_lost: u64,
    ) -> Result<()> {
        let audit_record = &mut ctx.accounts.audit_record;
        
        // In a real scenario, this would likely be an admin-only function or go through a DAO vote
        // For demonstration, we simply mark it as exploited and un-staked (slashed)
        // You would then transfer funds from stake_vault to the reporter, or burn them
        
        audit_record.is_staked = false;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(program_id_audited: String)]
pub struct RegisterAudit<'info> {
    #[account(
        init,
        payer = auditor,
        space = 8 + 32 + 4 + 100 + 1 + 32 + 8 + 1 + 1 + 1, // rough sizing
        seeds = [b"audit", auditor.key().as_ref(), program_id_audited.as_bytes()],
        bump
    )]
    pub audit_record: Account<'info, AuditRecord>,
    
    #[account(mut)]
    pub auditor: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeCertificate<'info> {
    #[account(mut, has_one = auditor)]
    pub audit_record: Account<'info, AuditRecord>,
    
    /// CHECK: PDA vault for holding stake
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
    #[account(mut)]
    pub audit_record: Account<'info, AuditRecord>,
    
    // In production, you'd want an admin/reporter signer checking
    // #[account(mut)]
    // pub reporter: Signer<'info>,
}

#[account]
pub struct AuditRecord {
    pub auditor: Pubkey,
    pub program_id_audited: String, // could be base58 pubkey or name
    pub score: u8,
    pub report_hash: [u8; 32],
    pub audit_date: i64,
    pub critical_count: u8,
    pub high_count: u8,
    pub is_staked: bool,
}
