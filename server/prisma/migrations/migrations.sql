UPDATE "DSAProblem"
SET "solveCount" = 1
WHERE "status" = 'SOLVED'
  AND "solveCount" = 0;