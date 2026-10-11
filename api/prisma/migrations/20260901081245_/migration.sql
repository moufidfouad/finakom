-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('draft', 'completed');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('ACHATS', 'VENTES', 'BANQUE', 'CAISSE', 'OD', 'PAIE');

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('CLIENTS', 'FOURNISSEURS', 'VENTES_MARCHANDISES', 'VENTES_SERVICES', 'ACHATS', 'TVA_COLLECTEE', 'TVA_DEDUCTIBLE', 'BANQUE', 'CAISSE', 'CHARGES_PERSONNEL', 'PERSONNEL_REMUNERATIONS_DUES', 'ORGANISMES_SOCIAUX', 'DOTATIONS_AMORTISSEMENTS', 'AMORTISSEMENTS_CUMULES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "google_id" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'local',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "sector" TEXT,
    "address" TEXT,
    "accounting_system" TEXT NOT NULL DEFAULT 'Normal',
    "fiscal_regime" TEXT,
    "logo_url" TEXT,
    "directory_visibility" TEXT NOT NULL DEFAULT 'Brouillon',
    "public_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_members" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "exercice_n_date" TIMESTAMP(3) NOT NULL,
    "exercice_n1_date" TIMESTAMP(3),
    "analyst_name" TEXT,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_lines" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "label" TEXT,
    "debit_n" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit_n" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "debit_n1" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit_n1" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "line_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "analysis_id" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("analysis_id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "employment_type" TEXT NOT NULL,
    "gross_salary" DECIMAL(14,2) NOT NULL,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "contract_type" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Actif',
    "work_location" TEXT,
    "weekly_hours" DECIMAL(4,1),
    "trial_period_months" INTEGER,
    "contract_end_date" TIMESTAMP(3),
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "salary_min" DECIMAL(14,2) NOT NULL,
    "salary_max" DECIMAL(14,2) NOT NULL,
    "main_tasks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "absence_reason" TEXT,
    "days_present" INTEGER NOT NULL,
    "days_workable" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lateness_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TEXT NOT NULL,
    "arrival_time" TEXT NOT NULL,
    "late_minutes" INTEGER NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lateness_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worked_hours" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_date" TIMESTAMP(3) NOT NULL,
    "contractual_hours" DECIMAL(6,2) NOT NULL,
    "actual_hours" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worked_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_date" TIMESTAMP(3) NOT NULL,
    "gross_salary" DECIMAL(14,2) NOT NULL,
    "bonus" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "late_penalty" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "social_contribution" DECIMAL(14,2) NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'En attente',
    "payment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "number_of_days" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_settings" (
    "company_id" TEXT NOT NULL,
    "tva_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "quote_validity_days" INTEGER NOT NULL DEFAULT 30,
    "payment_terms_days" INTEGER NOT NULL DEFAULT 30,
    "late_penalty_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 1.5,
    "cash_discount_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "vat_mention" TEXT,
    "payment_conditions" TEXT,
    "delivery_conditions" TEXT,
    "legal_mention" TEXT,
    "warranty" TEXT,
    "bank_details" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoicing_settings_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "rccm" TEXT,
    "quality" TEXT NOT NULL DEFAULT 'Nouveau',
    "credit_limit" DECIMAL(14,2),
    "default_discount_percent" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "selling_price_ht" DECIMAL(14,2) NOT NULL,
    "unit_cost" DECIMAL(14,2),
    "track_inventory" BOOLEAN NOT NULL DEFAULT false,
    "stock_min" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock_initial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequences" (
    "company_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("company_id","doc_type","year")
);

-- CreateTable
CREATE TABLE "sales_documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "tva_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "linked_quote_id" TEXT,
    "linked_invoice_id" TEXT,
    "created_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_document_lines" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "product_id" TEXT,
    "designation" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "quantity_delivered" DECIMAL(12,2),
    "unit_price_ht" DECIMAL(14,2) NOT NULL,
    "observation" TEXT,
    "line_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sales_document_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "method" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_asset_settings" (
    "company_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "closing_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "corporeal_threshold" DECIMAL(14,2) NOT NULL DEFAULT 500000,
    "incorporeal_threshold" DECIMAL(14,2) NOT NULL DEFAULT 300000,
    "degressive_coefficient" DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_asset_settings_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "fixed_assets" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "acquisition_date" TIMESTAMP(3) NOT NULL,
    "designation" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "method" TEXT NOT NULL DEFAULT 'Linéaire',
    "duration_years" INTEGER,
    "gross_value" DECIMAL(16,2) NOT NULL,
    "created_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_movements" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "fixed_asset_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "piece_number" TEXT,
    "designation" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "disposal_price" DECIMAL(16,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_settings" (
    "company_id" TEXT NOT NULL,
    "opening_cash_balance" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "opening_bank_balance" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "alert_threshold" DECIMAL(16,2) NOT NULL DEFAULT 1000000,
    "critical_threshold" DECIMAL(16,2) NOT NULL DEFAULT 300000,
    "avg_collection_days" INTEGER NOT NULL DEFAULT 30,
    "avg_payment_days" INTEGER NOT NULL DEFAULT 45,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treasury_settings_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "treasury_entries" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "piece_number" TEXT,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "support" TEXT NOT NULL,
    "payment_method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Réalisé',
    "created_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treasury_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_budget_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "rubric" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL DEFAULT 0,

    CONSTRAINT "treasury_budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_plans" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Brouillon',
    "horizon_years" INTEGER NOT NULL DEFAULT 3,
    "narrative_sections" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_plan_investments" (
    "id" TEXT NOT NULL,
    "business_plan_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "business_plan_investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_plan_fundings" (
    "id" TEXT NOT NULL,
    "business_plan_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "business_plan_fundings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_plan_suppliers" (
    "id" TEXT NOT NULL,
    "business_plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supply_type" TEXT NOT NULL,
    "annual_amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "business_plan_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_plan_pl_lines" (
    "id" TEXT NOT NULL,
    "business_plan_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "business_plan_pl_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_plan_cashflow_lines" (
    "id" TEXT NOT NULL,
    "business_plan_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "business_plan_cashflow_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_plan_balance_lines" (
    "id" TEXT NOT NULL,
    "business_plan_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "business_plan_balance_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "role" "AccountRole",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_sequences" (
    "company_id" TEXT NOT NULL,
    "journal" "JournalType" NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "journal_entry_sequences_pkey" PRIMARY KEY ("company_id","journal","year")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "journal" "JournalType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "piece_number" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source_type" TEXT,
    "source_id" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "chart_of_account_id" TEXT NOT NULL,
    "label" TEXT,
    "debit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "line_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "rccm" TEXT,
    "quality" TEXT NOT NULL DEFAULT 'Nouveau',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "tva_rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "linked_order_id" TEXT,
    "created_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_document_lines" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "product_id" TEXT,
    "designation" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price_ht" DECIMAL(14,2) NOT NULL,
    "observation" TEXT,
    "line_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_document_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "method" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_document_sequences" (
    "company_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_document_sequences_pkey" PRIMARY KEY ("company_id","doc_type","year")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL,
    "reference" TEXT,
    "matched_entry_id" TEXT,
    "import_batch" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_amendments" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "previous_position" TEXT,
    "new_position" TEXT,
    "previous_department" TEXT,
    "new_department" TEXT,
    "previous_gross_salary" DECIMAL(14,2),
    "new_gross_salary" DECIMAL(14,2),
    "previous_contract_type" TEXT,
    "new_contract_type" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_year_closings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "closing_date" TIMESTAMP(3) NOT NULL,
    "net_result" DECIMAL(16,2) NOT NULL,
    "closing_entry_id" TEXT,
    "closed_by_id" TEXT,
    "closed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_year_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_product_prices" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "unit_price_ht" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_budget_lines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(16,2) NOT NULL DEFAULT 0,

    CONSTRAINT "income_budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "photo_url" TEXT,
    "google_id" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'local',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_verification_tokens" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cvs" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'Brouillon',
    "template" TEXT NOT NULL DEFAULT 'classique',
    "show_full_name" BOOLEAN NOT NULL DEFAULT true,
    "show_photo" BOOLEAN NOT NULL DEFAULT false,
    "show_phone" BOOLEAN NOT NULL DEFAULT false,
    "permits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_skills" (
    "id" TEXT NOT NULL,
    "cv_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "specificities" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "cv_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_languages" (
    "id" TEXT NOT NULL,
    "cv_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "cv_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_educations" (
    "id" TEXT NOT NULL,
    "cv_id" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER,

    CONSTRAINT "cv_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_experiences" (
    "id" TEXT NOT NULL,
    "cv_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "cv_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "contract_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ouverte',
    "desired_experience_years" INTEGER,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posting_skills" (
    "id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "job_posting_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "cv_snapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Reçue',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_job_notifications" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "emailed_at" TIMESTAMP(3),

    CONSTRAINT "candidate_job_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_application_notifications" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "job_application_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "company_application_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_contact_notifications" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "cv_id" TEXT NOT NULL,
    "cv_title" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "candidate_contact_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "company_id" TEXT,
    "candidate_id" TEXT,
    "last_read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "sender_user_id" TEXT,
    "sender_candidate_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_reports" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "reporter_type" TEXT NOT NULL,
    "reporter_user_id" TEXT,
    "reporter_candidate_id" TEXT,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "conversation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "vat_standard_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.1925,
    "vat_export_rate" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "corporate_tax_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.30,
    "corporate_tax_min_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.01,
    "corporate_tax_installment_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.25,
    "business_license_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.011,
    "social_contrib_employer_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.142,
    "social_contrib_employee_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.042,
    "vocational_training_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.01,
    "withholding_tax_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.155,
    "income_tax_allowance_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.30,
    "income_tax_bracket1_threshold" DECIMAL(14,2) NOT NULL DEFAULT 2000000,
    "income_tax_bracket1_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.10,
    "income_tax_bracket2_threshold" DECIMAL(14,2) NOT NULL DEFAULT 3000000,
    "income_tax_bracket2_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.165,
    "income_tax_bracket3_threshold" DECIMAL(14,2) NOT NULL DEFAULT 5000000,
    "income_tax_bracket3_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.25,
    "income_tax_bracket4_rate" DECIMAL(6,4) NOT NULL DEFAULT 0.35,
    "corporate_tax_min_threshold" DECIMAL(14,2) NOT NULL DEFAULT 2000000,
    "vat_mandatory_threshold" DECIMAL(14,2) NOT NULL DEFAULT 50000000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_vat_returns" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "sales_inc_tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "purchases_inc_tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'À déclarer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_vat_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_tax_returns" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "accounting_result" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fiscal_reintegrations" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fiscal_deductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "prior_year_loss" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "annual_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "prior_year_tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_credits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "installments_paid_q1" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "installments_paid_q2" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "installments_paid_q3" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "installments_paid_q4" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_tax_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_license_returns" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "annual_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fixed_duty" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_license_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_payroll_taxes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "gross_payroll" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_payroll_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "verification_tokens_user_id_type_idx" ON "verification_tokens"("user_id", "type");

-- CreateIndex
CREATE INDEX "companies_user_id_idx" ON "companies"("user_id");

-- CreateIndex
CREATE INDEX "company_members_user_id_idx" ON "company_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_company_id_user_id_key" ON "company_members"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "analyses_company_id_idx" ON "analyses"("company_id");

-- CreateIndex
CREATE INDEX "balance_lines_analysis_id_idx" ON "balance_lines"("analysis_id");

-- CreateIndex
CREATE INDEX "balance_lines_account_number_idx" ON "balance_lines"("account_number");

-- CreateIndex
CREATE INDEX "employees_company_id_idx" ON "employees"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_company_id_code_key" ON "employees"("company_id", "code");

-- CreateIndex
CREATE INDEX "job_positions_company_id_idx" ON "job_positions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_positions_company_id_code_key" ON "job_positions"("company_id", "code");

-- CreateIndex
CREATE INDEX "attendance_records_employee_id_idx" ON "attendance_records"("employee_id");

-- CreateIndex
CREATE INDEX "lateness_records_employee_id_idx" ON "lateness_records"("employee_id");

-- CreateIndex
CREATE INDEX "worked_hours_employee_id_idx" ON "worked_hours"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "worked_hours_employee_id_period_date_key" ON "worked_hours"("employee_id", "period_date");

-- CreateIndex
CREATE INDEX "payrolls_employee_id_idx" ON "payrolls"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_employee_id_period_date_key" ON "payrolls"("employee_id", "period_date");

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "clients_company_id_idx" ON "clients"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_company_id_code_key" ON "clients"("company_id", "code");

-- CreateIndex
CREATE INDEX "products_company_id_idx" ON "products"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_company_id_code_key" ON "products"("company_id", "code");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "sales_documents_company_id_idx" ON "sales_documents"("company_id");

-- CreateIndex
CREATE INDEX "sales_documents_client_id_idx" ON "sales_documents"("client_id");

-- CreateIndex
CREATE INDEX "sales_documents_created_by_id_idx" ON "sales_documents"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_documents_company_id_number_key" ON "sales_documents"("company_id", "number");

-- CreateIndex
CREATE INDEX "sales_document_lines_document_id_idx" ON "sales_document_lines"("document_id");

-- CreateIndex
CREATE INDEX "payments_document_id_idx" ON "payments"("document_id");

-- CreateIndex
CREATE INDEX "fixed_assets_company_id_idx" ON "fixed_assets"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_company_id_code_key" ON "fixed_assets"("company_id", "code");

-- CreateIndex
CREATE INDEX "asset_movements_company_id_idx" ON "asset_movements"("company_id");

-- CreateIndex
CREATE INDEX "asset_movements_fixed_asset_id_idx" ON "asset_movements"("fixed_asset_id");

-- CreateIndex
CREATE INDEX "treasury_entries_company_id_idx" ON "treasury_entries"("company_id");

-- CreateIndex
CREATE INDEX "treasury_entries_company_id_date_idx" ON "treasury_entries"("company_id", "date");

-- CreateIndex
CREATE INDEX "treasury_budget_lines_company_id_fiscal_year_idx" ON "treasury_budget_lines"("company_id", "fiscal_year");

-- CreateIndex
CREATE UNIQUE INDEX "treasury_budget_lines_company_id_fiscal_year_rubric_type_mo_key" ON "treasury_budget_lines"("company_id", "fiscal_year", "rubric", "type", "month");

-- CreateIndex
CREATE INDEX "business_plans_company_id_idx" ON "business_plans"("company_id");

-- CreateIndex
CREATE INDEX "business_plan_investments_business_plan_id_idx" ON "business_plan_investments"("business_plan_id");

-- CreateIndex
CREATE INDEX "business_plan_fundings_business_plan_id_idx" ON "business_plan_fundings"("business_plan_id");

-- CreateIndex
CREATE INDEX "business_plan_suppliers_business_plan_id_idx" ON "business_plan_suppliers"("business_plan_id");

-- CreateIndex
CREATE INDEX "business_plan_pl_lines_business_plan_id_year_idx" ON "business_plan_pl_lines"("business_plan_id", "year");

-- CreateIndex
CREATE INDEX "business_plan_cashflow_lines_business_plan_id_month_idx" ON "business_plan_cashflow_lines"("business_plan_id", "month");

-- CreateIndex
CREATE INDEX "business_plan_balance_lines_business_plan_id_year_idx" ON "business_plan_balance_lines"("business_plan_id", "year");

-- CreateIndex
CREATE INDEX "chart_of_accounts_company_id_idx" ON "chart_of_accounts"("company_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_company_id_role_idx" ON "chart_of_accounts"("company_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_company_id_account_number_key" ON "chart_of_accounts"("company_id", "account_number");

-- CreateIndex
CREATE INDEX "journal_entries_company_id_idx" ON "journal_entries"("company_id");

-- CreateIndex
CREATE INDEX "journal_entries_company_id_date_idx" ON "journal_entries"("company_id", "date");

-- CreateIndex
CREATE INDEX "journal_entries_source_type_source_id_idx" ON "journal_entries"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journal_entry_id_idx" ON "journal_entry_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_chart_of_account_id_idx" ON "journal_entry_lines"("chart_of_account_id");

-- CreateIndex
CREATE INDEX "suppliers_company_id_idx" ON "suppliers"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_company_id_code_key" ON "suppliers"("company_id", "code");

-- CreateIndex
CREATE INDEX "purchase_documents_company_id_idx" ON "purchase_documents"("company_id");

-- CreateIndex
CREATE INDEX "purchase_documents_supplier_id_idx" ON "purchase_documents"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_documents_created_by_id_idx" ON "purchase_documents"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_documents_company_id_number_key" ON "purchase_documents"("company_id", "number");

-- CreateIndex
CREATE INDEX "purchase_document_lines_document_id_idx" ON "purchase_document_lines"("document_id");

-- CreateIndex
CREATE INDEX "supplier_payments_document_id_idx" ON "supplier_payments"("document_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_entity_type_entity_id_idx" ON "audit_logs"("company_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_lines_matched_entry_id_key" ON "bank_statement_lines"("matched_entry_id");

-- CreateIndex
CREATE INDEX "bank_statement_lines_company_id_idx" ON "bank_statement_lines"("company_id");

-- CreateIndex
CREATE INDEX "bank_statement_lines_company_id_date_idx" ON "bank_statement_lines"("company_id", "date");

-- CreateIndex
CREATE INDEX "contract_amendments_employee_id_idx" ON "contract_amendments"("employee_id");

-- CreateIndex
CREATE INDEX "fiscal_year_closings_company_id_idx" ON "fiscal_year_closings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_year_closings_company_id_fiscal_year_key" ON "fiscal_year_closings"("company_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "client_product_prices_client_id_idx" ON "client_product_prices"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_product_prices_client_id_product_id_key" ON "client_product_prices"("client_id", "product_id");

-- CreateIndex
CREATE INDEX "income_budget_lines_company_id_fiscal_year_idx" ON "income_budget_lines"("company_id", "fiscal_year");

-- CreateIndex
CREATE UNIQUE INDEX "income_budget_lines_company_id_fiscal_year_type_month_key" ON "income_budget_lines"("company_id", "fiscal_year", "type", "month");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_google_id_key" ON "candidates"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_verification_tokens_token_hash_key" ON "candidate_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "candidate_verification_tokens_candidate_id_type_idx" ON "candidate_verification_tokens"("candidate_id", "type");

-- CreateIndex
CREATE INDEX "cvs_candidate_id_idx" ON "cvs"("candidate_id");

-- CreateIndex
CREATE INDEX "cv_skills_cv_id_idx" ON "cv_skills"("cv_id");

-- CreateIndex
CREATE INDEX "cv_languages_cv_id_idx" ON "cv_languages"("cv_id");

-- CreateIndex
CREATE INDEX "cv_educations_cv_id_idx" ON "cv_educations"("cv_id");

-- CreateIndex
CREATE INDEX "cv_experiences_cv_id_idx" ON "cv_experiences"("cv_id");

-- CreateIndex
CREATE INDEX "job_postings_company_id_idx" ON "job_postings"("company_id");

-- CreateIndex
CREATE INDEX "job_postings_status_idx" ON "job_postings"("status");

-- CreateIndex
CREATE INDEX "job_postings_created_by_id_idx" ON "job_postings"("created_by_id");

-- CreateIndex
CREATE INDEX "job_posting_skills_job_posting_id_idx" ON "job_posting_skills"("job_posting_id");

-- CreateIndex
CREATE INDEX "job_applications_job_posting_id_idx" ON "job_applications"("job_posting_id");

-- CreateIndex
CREATE INDEX "job_applications_candidate_id_idx" ON "job_applications"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_posting_id_candidate_id_key" ON "job_applications"("job_posting_id", "candidate_id");

-- CreateIndex
CREATE INDEX "candidate_job_notifications_candidate_id_read_at_idx" ON "candidate_job_notifications"("candidate_id", "read_at");

-- CreateIndex
CREATE INDEX "candidate_job_notifications_emailed_at_idx" ON "candidate_job_notifications"("emailed_at");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_job_notifications_candidate_id_job_posting_id_key" ON "candidate_job_notifications"("candidate_id", "job_posting_id");

-- CreateIndex
CREATE INDEX "company_application_notifications_company_id_read_at_idx" ON "company_application_notifications"("company_id", "read_at");

-- CreateIndex
CREATE INDEX "candidate_contact_notifications_candidate_id_read_at_idx" ON "candidate_contact_notifications"("candidate_id", "read_at");

-- CreateIndex
CREATE INDEX "conversation_participants_company_id_idx" ON "conversation_participants"("company_id");

-- CreateIndex
CREATE INDEX "conversation_participants_candidate_id_idx" ON "conversation_participants"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_company_id_key" ON "conversation_participants"("conversation_id", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_candidate_id_key" ON "conversation_participants"("conversation_id", "candidate_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "conversation_reports_conversation_id_idx" ON "conversation_reports"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_reports_resolved_at_idx" ON "conversation_reports"("resolved_at");

-- CreateIndex
CREATE UNIQUE INDEX "tax_settings_company_id_key" ON "tax_settings"("company_id");

-- CreateIndex
CREATE INDEX "monthly_vat_returns_company_id_idx" ON "monthly_vat_returns"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_vat_returns_company_id_period_key" ON "monthly_vat_returns"("company_id", "period");

-- CreateIndex
CREATE INDEX "corporate_tax_returns_company_id_idx" ON "corporate_tax_returns"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_tax_returns_company_id_fiscal_year_key" ON "corporate_tax_returns"("company_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "business_license_returns_company_id_idx" ON "business_license_returns"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_license_returns_company_id_fiscal_year_key" ON "business_license_returns"("company_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "monthly_payroll_taxes_company_id_idx" ON "monthly_payroll_taxes"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_payroll_taxes_company_id_period_key" ON "monthly_payroll_taxes"("company_id", "period");

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_lines" ADD CONSTRAINT "balance_lines_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lateness_records" ADD CONSTRAINT "lateness_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worked_hours" ADD CONSTRAINT "worked_hours_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoicing_settings" ADD CONSTRAINT "invoicing_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_document_lines" ADD CONSTRAINT "sales_document_lines_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "sales_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_document_lines" ADD CONSTRAINT "sales_document_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "sales_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_asset_settings" ADD CONSTRAINT "fixed_asset_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_movements" ADD CONSTRAINT "asset_movements_fixed_asset_id_fkey" FOREIGN KEY ("fixed_asset_id") REFERENCES "fixed_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_settings" ADD CONSTRAINT "treasury_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_entries" ADD CONSTRAINT "treasury_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_entries" ADD CONSTRAINT "treasury_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasury_budget_lines" ADD CONSTRAINT "treasury_budget_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plans" ADD CONSTRAINT "business_plans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plans" ADD CONSTRAINT "business_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plan_investments" ADD CONSTRAINT "business_plan_investments_business_plan_id_fkey" FOREIGN KEY ("business_plan_id") REFERENCES "business_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plan_fundings" ADD CONSTRAINT "business_plan_fundings_business_plan_id_fkey" FOREIGN KEY ("business_plan_id") REFERENCES "business_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plan_suppliers" ADD CONSTRAINT "business_plan_suppliers_business_plan_id_fkey" FOREIGN KEY ("business_plan_id") REFERENCES "business_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plan_pl_lines" ADD CONSTRAINT "business_plan_pl_lines_business_plan_id_fkey" FOREIGN KEY ("business_plan_id") REFERENCES "business_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plan_cashflow_lines" ADD CONSTRAINT "business_plan_cashflow_lines_business_plan_id_fkey" FOREIGN KEY ("business_plan_id") REFERENCES "business_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plan_balance_lines" ADD CONSTRAINT "business_plan_balance_lines_business_plan_id_fkey" FOREIGN KEY ("business_plan_id") REFERENCES "business_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_sequences" ADD CONSTRAINT "journal_entry_sequences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_documents" ADD CONSTRAINT "purchase_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_documents" ADD CONSTRAINT "purchase_documents_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_documents" ADD CONSTRAINT "purchase_documents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_document_lines" ADD CONSTRAINT "purchase_document_lines_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "purchase_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_document_lines" ADD CONSTRAINT "purchase_document_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "purchase_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_document_sequences" ADD CONSTRAINT "purchase_document_sequences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_matched_entry_id_fkey" FOREIGN KEY ("matched_entry_id") REFERENCES "treasury_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_year_closings" ADD CONSTRAINT "fiscal_year_closings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_year_closings" ADD CONSTRAINT "fiscal_year_closings_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_product_prices" ADD CONSTRAINT "client_product_prices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_product_prices" ADD CONSTRAINT "client_product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_budget_lines" ADD CONSTRAINT "income_budget_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_verification_tokens" ADD CONSTRAINT "candidate_verification_tokens_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_skills" ADD CONSTRAINT "cv_skills_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_languages" ADD CONSTRAINT "cv_languages_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_educations" ADD CONSTRAINT "cv_educations_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_experiences" ADD CONSTRAINT "cv_experiences_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting_skills" ADD CONSTRAINT "job_posting_skills_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_job_notifications" ADD CONSTRAINT "candidate_job_notifications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_job_notifications" ADD CONSTRAINT "candidate_job_notifications_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_application_notifications" ADD CONSTRAINT "company_application_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_application_notifications" ADD CONSTRAINT "company_application_notifications_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_contact_notifications" ADD CONSTRAINT "candidate_contact_notifications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_candidate_id_fkey" FOREIGN KEY ("sender_candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_reports" ADD CONSTRAINT "conversation_reports_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_reports" ADD CONSTRAINT "conversation_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_reports" ADD CONSTRAINT "conversation_reports_reporter_candidate_id_fkey" FOREIGN KEY ("reporter_candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_settings" ADD CONSTRAINT "tax_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_vat_returns" ADD CONSTRAINT "monthly_vat_returns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_tax_returns" ADD CONSTRAINT "corporate_tax_returns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_license_returns" ADD CONSTRAINT "business_license_returns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_payroll_taxes" ADD CONSTRAINT "monthly_payroll_taxes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
