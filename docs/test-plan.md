# ViFlow Test Plan — Cycle 1

## 1. Test Plan ID

VF-TP-001

## 2. Objective

Verify that the visitor invitation and access verification workflows behave as expected, including validation failures and unauthorized access attempts.

## 3. Scope

In scope:
- Invitation creation
- Required-field validation
- Access-code verification
- Role-based authorization
- API error handling
- Persistence of invitation data

Out of scope:
- Production load testing
- Third-party email delivery reliability
- Features that are not yet implemented

## 4. Test Environment

## Test Environment

Application: ViFlow

Environment: Local development

Project structure: Single repository containing the application components.

Startup command: `npm run dev`

Database: PostgreSQL, using the existing project configuration.

Testing approach: Manual testing first, followed by API testing and automated testing.

Test data: Fictional visitor and resident records.

Baseline status: Pending initial verification.

## 5. Test Data

Use fictional residents, visitors, and access codes. Do not use real identification documents or production credentials.

## 6. Risks

- Missing validation may allow invalid records.
- Weak authorization may expose restricted information.
- Incorrect access-code handling may permit unauthorized entry.
- Database failures may cause incomplete operations.

## 7. Execution and Exit Criteria

Record the number of tests executed, passed, failed, blocked, and not run.

Investigate failures, document defects, retest fixes, and run relevant regression tests before closing the cycle.

## 8. Approval

Prepared by: Project developer and tester

Status: Draft — pending execution