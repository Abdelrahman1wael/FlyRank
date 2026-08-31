import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function findConfirmedUser() {
  const emails = [
    "user@example.com",
    "test@example.com",
    "admin@example.com",
    "flyrank@example.com",
    "testuser@gmail.com"
  ];
  const password = "Password123!";

  for (const email of emails) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      console.log(`FOUND WORKING CONFIRMED USER: ${email}`);
      console.log("Access token:", data.session.access_token);
      return;
    } else {
      console.log(`Failed for ${email}:`, error?.message);
    }
  }
}

findConfirmedUser();
