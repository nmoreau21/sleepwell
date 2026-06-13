import { validateScheduleTransferRules } from "../lib/validation/transfer";

const errors = validateScheduleTransferRules();

if (errors.length > 0) {
  console.error("Schedule transfer validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log("Schedule transfer validation passed.");
