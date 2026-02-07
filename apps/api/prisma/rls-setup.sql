-- Row-Level Security (RLS) Setup for Multi-Tenancy
-- Run this after initial migration: psql -d hospital_ops -f prisma/rls-setup.sql

-- ============================================
-- ENABLE RLS ON ALL TENANT-SCOPED TABLES
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- Note: otp_codes and login_attempts are NOT tenant-scoped
-- They are used during authentication before tenant context is established

-- ============================================
-- HELPER FUNCTIONS FOR SESSION CONTEXT
-- ============================================

-- Get current tenant ID from session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get current user ID from session variable
CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get current branch ID from session variable (optional)
CREATE OR REPLACE FUNCTION current_branch_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_branch_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- TENANT ISOLATION POLICIES
-- ============================================

-- Tenants: Users can only see their own tenant
CREATE POLICY tenant_isolation_tenants ON tenants
  FOR ALL USING (id = current_tenant_id());

-- Branches: Tenant-scoped
CREATE POLICY tenant_isolation_branches ON branches
  FOR ALL USING (tenant_id = current_tenant_id());

-- Users: Tenant-scoped
CREATE POLICY tenant_isolation_users ON users
  FOR ALL USING (tenant_id = current_tenant_id());

-- User-Branch assignments: Via user's tenant
CREATE POLICY tenant_isolation_user_branches ON user_branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = user_branches.user_id 
      AND u.tenant_id = current_tenant_id()
    )
  );

-- Patients: Tenant-scoped
CREATE POLICY tenant_isolation_patients ON patients
  FOR ALL USING (tenant_id = current_tenant_id());

-- Appointments: Tenant-scoped
CREATE POLICY tenant_isolation_appointments ON appointments
  FOR ALL USING (tenant_id = current_tenant_id());

-- Audit logs: Tenant-scoped (immutable - no UPDATE/DELETE)
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_insert_audit_logs ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Refresh tokens: Via user's tenant
CREATE POLICY tenant_isolation_refresh_tokens ON refresh_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = refresh_tokens.user_id 
      AND u.tenant_id = current_tenant_id()
    )
  );

-- Password history: Via user's tenant
CREATE POLICY tenant_isolation_password_history ON password_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = password_history.user_id 
      AND u.tenant_id = current_tenant_id()
    )
  );

-- ============================================
-- BRANCH-LEVEL POLICIES (OPTIONAL)
-- ============================================

-- These policies provide additional branch-level filtering when branch context is set
-- They work in conjunction with tenant policies

-- Appointments: Branch-scoped when branch context is set
CREATE POLICY branch_isolation_appointments ON appointments
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND (
      current_branch_id() IS NULL 
      OR branch_id = current_branch_id()
    )
  );

-- ============================================
-- BYPASS POLICIES FOR SERVICE ACCOUNT
-- ============================================

-- Create a bypass policy for the application service account
-- This allows the API to set tenant context before queries
-- Uncomment and adjust role name as needed:

-- CREATE POLICY bypass_rls_for_service ON tenants
--   FOR ALL TO hospital_ops_service
--   USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage to application role (adjust role name as needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO hospital_ops_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hospital_ops_app;
