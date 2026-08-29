import express from "express";
import analyzeRouter from "./src/routes/analyze.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", analyzeRouter);

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
