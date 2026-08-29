import { z } from "zod";

// Input Validation Schema (validates incoming client request)
export const InputSchema = z.object({
  text: z.string().min(1, "Text cannot be empty").max(2000, "Text exceeds limit"),
  category_hint: z.string().optional(),
});

// Output Schema (the target structure defined in JOB-CARD.md)
export const OutputSchema = z.object({
  category: z.enum(["support", "billing", "technical", "spam"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1, "Summary cannot be empty"),
  tags: z.array(z.string()),
  requires_human: z.boolean(),
});

// Hard-coded mock data satisfying OutputSchema, for Stub Mode
export const stubOutput = {
  category: "technical",
  confidence: 0.95,
  summary: "Stub response: user experienced a database connection failure...",
  tags: ["database", "error", "checkout"],
  requires_human: true,
};