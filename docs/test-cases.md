## VF-TC-002 — Required Field Validation

**Feature:** Visitor invitation

**Priority:** High

**Test type:** Functional / Negative testing

**Preconditions:**
- The application is running in the development environment.
- A test resident account is available.
- The invitation form or corresponding API endpoint exists.

**Test data:**
- Resident: Test Resident A
- Visitor email: Leave blank
- Other required fields: Provide valid fictional values.

**Steps:**
1. Open the invitation form or prepare the API request.
2. Leave the required visitor email field empty.
3. Submit the request.
4. Inspect the response and verify whether a record was created.

**Expected result:**
The application rejects the request, communicates the validation error, and does not create an invalid invitation.

**Actual result:** Not yet tested.

**Status:** Not Run.

**Defect ID:** To be assigned if a defect is confirmed.

**Execution date:** To be recorded.