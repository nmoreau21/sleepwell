import { validateCreateMatchRules } from "../services/matches/validate-create-match";

const errors = validateCreateMatchRules();

if (errors.length > 0) {
  console.error("Create match validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log("Create match validation passed.");
