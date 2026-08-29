import { z } from "zod";

// Input Validation Schema (validates incoming client request)
export const InputSchema = z.object({
  text: z.string().min(1, "Text cannot be empty").max(2000, "Text exceeds limit"),
  category_hint: z.string().optional(),
});

// Stage 1 Output Schema
export const OutputSchema = z.object({
  category: z.enum(["support", "billing", "technical", "spam"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1, "Summary cannot be empty"),
  tags: z.array(z.string()),
  requires_human: z.boolean(),
});

export const stubOutput = {
  category: "technical",
  confidence: 0.95,
  summary: "Stub response: user experienced a database connection failure...",
  tags: ["database", "error", "checkout"],
  requires_human: true,
};

// Stage 2+ Job Card Output Schema
export const JobCardOutputSchema = z.object({
  status: z.enum(["success", "failed", "pending"]),
  confidence: z.number().min(0).max(1),
  extractedData: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    priority: z.enum(["low", "medium", "high"]),
  }),
  summary: z.string(),
});

export const stubResponse = {
  status: "success",
  confidence: 0.98,
  extractedData: {
    title: "Database connection failure in billing module",
    tags: ["database", "billing", "error"],
    priority: "high",
  },
  summary: "The billing engine failed to update invoice yesterday due to connection timeout.",
};