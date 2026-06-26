import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

type CreateTestUserOptions = {
  email?: string;
  password?: string;
  mosqueId?: string;
  role?: string;
  fullName?: string;
};

export type TestUser = {
  id?: string;
  email: string;
  password: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for this Playwright helper.`);
  }

  return value;
}

function getAdminSupabase() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function login(
  page: Page,
  email = process.env.E2E_EMAIL,
  password = process.env.E2E_PASSWORD
) {
  if (!email || !password) {
    throw new Error("E2E_EMAIL and E2E_PASSWORD are required to log in.");
  }

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /^logout$/i }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function createTestUser(options: CreateTestUserOptions = {}): Promise<TestUser> {
  const supabase = getAdminSupabase();
  const timestamp = Date.now();
  const email = options.email || `playwright-${timestamp}@smartmasjid.test`;
  const password = options.password || `SmartMasjid-${timestamp}!`;
  const fullName = options.fullName || "Playwright Test User";

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Failed to create test user.");
  }

  const mosqueId = options.mosqueId || process.env.E2E_MOSQUE_ID;
  const role = options.role || "admin_masjid";

  if (mosqueId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        mosque_id: mosqueId,
        role,
        full_name: fullName,
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      throw new Error(profileError.message);
    }
  }

  return { id: data.user.id, email, password };
}

export async function cleanup(users: TestUser[] = []) {
  const supabase = getAdminSupabase();

  for (const user of users) {
    if (!user.id) continue;
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) console.warn(`Failed to delete test user ${user.id}: ${error.message}`);
  }
}
