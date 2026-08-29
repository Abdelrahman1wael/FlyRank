import express from "express";
import { InputSchema, stubOutput } from "../llm/schema.js";

const router = express.Router();

router.post("/analyze", (req, res) => {
  // 1. Input validation
  const validation = InputSchema.safeParse(req.body);
  if (!validation.success) {
    const errorDetails = validation.error.issues[0];
    return res.status(400).json({
      error: "Validation Failed",
      field: errorDetails.path.join("."),
      message: errorDetails.message,
    });
  }

  // 2. Stub-mode conditional override
  if (process.env.LLM_STUB === "1") {
    return res.status(200).json(stubOutput);
  }

  // 3. Real LLM pipeline placeholder (built in Stage 2+)
  return res.status(501).json({
    message: "LLM processing pipeline is not implemented yet.",
  });
});

export default router;