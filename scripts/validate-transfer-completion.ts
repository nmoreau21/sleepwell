import { validateTransferCompletionRules } from "../lib/validation/transfer-completion";

const errors = validateTransferCompletionRules();

if (errors.length > 0) {
  console.error("Transfer completion validation failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log("Transfer completion validation passed.");
