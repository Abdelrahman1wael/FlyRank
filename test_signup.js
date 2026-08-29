import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSignUp() {
  const testEmail = `flyrank_user_${Math.floor(Math.random() * 10000)}@gmail.com`;
  const testPassword = "Password123!";

  console.log(`Executing supabase.auth.signUp() for: ${testEmail}...`);

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (error) {
    console.error("❌ Sign Up Failed:", error.message);
  } else {
    console.log("=====================================");
    console.log("✅ supabase.auth.signUp() EXECUTED!");
    console.log("=====================================");
    console.log("User ID:", data.user?.id);
    console.log("User Email:", data.user?.email);
    console.log("Created At:", data.user?.created_at);
    console.log("Role:", data.user?.role);
    console.log("Identities Count:", data.user?.identities?.length);
    console.log("Session:", data.session ? "Active" : "Null (Pending email verification if enabled)");
    console.log("\nFull Supabase Response Object:");
    console.log(JSON.stringify(data, null, 2));
  }
}

testSignUp();
