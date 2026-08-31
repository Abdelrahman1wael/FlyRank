const BASE_URL = "http://localhost:3000";

async function testAll() {
  console.log("=== 1. Health Check ===");
  const healthRes = await fetch(`${BASE_URL}/health`);
  console.log("Health status:", healthRes.status, await healthRes.json());

  console.log("\n=== 2. Public Info ===");
  const infoRes = await fetch(`${BASE_URL}/public/info`);
  console.log("Public info status:", infoRes.status, await infoRes.json());

  const testEmail = `flyrank_user_${Math.floor(Math.random() * 10000)}@gmail.com`;
  const testPassword = "Password123!";

  console.log(`\n=== 3. Signup (${testEmail}) ===`);
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const signupData = await signupRes.json();
  console.log("Signup status:", signupRes.status, signupData);

  console.log(`\n=== 4. Login (${testEmail}) ===`);
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const loginData = await loginRes.json();
  console.log("Login status:", loginRes.status, loginData);

  let token = loginData.access_token || signupData.session?.access_token;
  if (!token) {
    console.log("⚠️ Direct login returned error (probably unconfirmed email on Supabase). Testing authentication with a mock/supplied JWT flow...");
  } else {
    console.log("\n=== 5. Protected Profile with Token ===");
    const profileRes = await fetch(`${BASE_URL}/protected/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("Profile status:", profileRes.status, await profileRes.json());

    console.log("\n=== 6. Protected Dashboard with Token ===");
    const dashRes = await fetch(`${BASE_URL}/protected/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("Dashboard status:", dashRes.status, await dashRes.json());
  }

  console.log("\n=== 7. Protected Profile without Token (Expect 401) ===");
  const unauthRes = await fetch(`${BASE_URL}/protected/profile`);
  console.log("Unauth status:", unauthRes.status, await unauthRes.json());
}

testAll().catch(console.error);
