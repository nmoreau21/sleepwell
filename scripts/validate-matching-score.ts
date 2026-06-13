import { validatePotentialConnectionScoring } from "../services/matching/score-potential-connection";

const errors = validatePotentialConnectionScoring();

if (errors.length > 0) {
  console.error("Matching score validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log("Matching score validation passed.");
