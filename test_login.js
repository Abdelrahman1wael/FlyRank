import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogIn() {
  const testEmail = "flyrank_user_3059@gmail.com";
  const testPassword = "Password123!";

  console.log(`Executing supabase.auth.signInWithPassword() for: ${testEmail}...`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (error) {
    console.error("❌ Log In Failed:", error.message);
  } else {
    console.log("=====================================");
    console.log("✅ supabase.auth.signInWithPassword() EXECUTED!");
    console.log("=====================================");
    console.log("User ID:", data.user?.id);
    console.log("User Email:", data.user?.email);
    console.log("Access Token (JWT):\n", data.session?.access_token);
    console.log("Token Type:", data.session?.token_type);
    console.log("Expires In (seconds):", data.session?.expires_in);
    console.log("Refresh Token:", data.session?.refresh_token ? "Generated" : "None");
  }
  process.exit(0);
}

testLogIn();
