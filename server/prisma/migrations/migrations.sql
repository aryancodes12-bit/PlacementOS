UPDATE "DSAProblem"
SET "solveCount" = 1
WHERE "status" = 'SOLVED'
  AND "solveCount" = 0;   
  -- Existing accounts were created before email verification existed.
UPDATE "User"
SET "emailVerified" = true;