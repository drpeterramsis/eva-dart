// EVA Dart - Supabase Login & Dashboard Logic

const SUPABASE_URL = 'https://iqgqoosfegnzvtjzfuep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ3Fvb3NmZWduenZ0anpmdWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNzMwMTgsImV4cCI6MjA2Mjk0OTAxOH0.3G0ufGo9Elh6TCB85N1y0hG3w4mPV6z6dvYFetmrZaE'; // Truncated for clarity
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const signoutBtn = document.getElementById('signout-btn');
const loginMessage = document.getElementById('login-message');

// Check Supabase for user approval
async function isApprovedUser(email) {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle(); // handles no or one row

  if (error) {
    console.error("Supabase error:", error);
    throw error;
  }
  return data;
}

// Show dashboard after login
function showDashboard(user) {
  authSection.style.display = 'none';
  dashboard.style.display = 'block';
  signoutBtn.style.display = 'inline-block';

  const welcomeHeading = dashboard.querySelector('h2');
  if (welcomeHeading) {
    welcomeHeading.textContent = `Welcome ${user.name} to EVA Dart`;
  }
}

// Sign out handler
signoutBtn.addEventListener('click', () => {
  localStorage.removeItem("eva_user");
  location.reload();
});

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMessage.textContent = '';
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const user = await isApprovedUser(email);
    if (!user) {
      loginMessage.textContent = "User not found or not approved.";
      return;
    }
    if (password !== user.code) {
      loginMessage.textContent = "Incorrect code/password.";
      return;
    }

    localStorage.setItem("eva_user", JSON.stringify(user));
    showDashboard(user);

  } catch (error) {
    loginMessage.textContent = "An error occurred during login. Please try again.";
  }
});

// Auto login (but verify user is still approved in database)
window.addEventListener('DOMContentLoaded', async () => {
  const savedUser = JSON.parse(localStorage.getItem("eva_user"));

  if (savedUser) {
    try {
      const approvedUser = await isApprovedUser(savedUser.email);

      if (approvedUser) {
        showDashboard(approvedUser); // Use latest user data from DB
      } else {
        localStorage.removeItem("eva_user");
        loginMessage.textContent = "Saved user is no longer approved.";
      }

    } catch (error) {
      localStorage.removeItem("eva_user");
      loginMessage.textContent = "Error verifying user. Please log in again.";
    }
  }
});
