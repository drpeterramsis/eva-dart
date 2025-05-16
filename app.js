// EVA Dart - Supabase Login & Dashboard Logic

const SUPABASE_URL = 'https://iqgqoosfegnzvtjzfuep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ3Fvb3NmZWduenZ0anpmdWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNzMwMTgsImV4cCI6MjA2Mjk0OTAxOH0.3G0ufGo9Elh6TCB85N1y0hG3w4mPV6z6dvYFetmrZaE';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const signoutBtn = document.getElementById('signout-btn');
const loginMessage = document.getElementById('login-message');
const userNameDisplay = document.getElementById('user-name');

const addDoctorBtn = document.getElementById('add-doctor-btn');
const addDoctorPopup = document.getElementById('add-doctor-popup');
const addDoctorForm = document.getElementById('add-doctor-form');
const cancelAddDoctorBtn = document.getElementById('cancel-add-doctor');
const addDoctorMessage = document.getElementById('add-doctor-message');

function getEvaUser() {
  try {
    const user = JSON.parse(localStorage.getItem("eva_user"));
    if (user && user.name && user.code) {
      return user;
    }
  } catch (e) {
    console.warn("Invalid eva_user in localStorage", e);
  }
  return null;
}

async function isApprovedUser(email) {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error);
    throw error;
  }
  return data;
}

function showDashboard(user) {
  authSection.style.display = 'none';
  dashboard.style.display = 'block';
  signoutBtn.style.display = 'inline-block';

  const welcomeHeading = dashboard.querySelector('h2');
  if (welcomeHeading) {
    welcomeHeading.textContent = `Welcome ${user.name} to EVA Dart`;
  }

  if (userNameDisplay) {
    userNameDisplay.textContent = user.name;
    userNameDisplay.style.display = 'block';
  }
}

signoutBtn.addEventListener('click', () => {
  localStorage.removeItem("eva_user");
  location.reload();
});

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

window.addEventListener('DOMContentLoaded', async () => {
  const savedUser = getEvaUser();

  if (savedUser) {
    try {
      const approvedUser = await isApprovedUser(savedUser.email);
      if (approvedUser) {
        showDashboard(approvedUser);
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

// Open popup on button click
addDoctorBtn.addEventListener('click', () => {
  addDoctorMessage.textContent = '';
  addDoctorForm.reset();
  addDoctorPopup.style.display = 'flex';
});

// Close popup on cancel
cancelAddDoctorBtn.addEventListener('click', () => {
  addDoctorPopup.style.display = 'none';
});

// Handle form submission
addDoctorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addDoctorMessage.textContent = '';

  const evaUser = getEvaUser();
  if (!evaUser) {
    addDoctorMessage.textContent = 'User session expired. Please log in again.';
    return;
  }

  const hcp = document.getElementById('hcp').value.trim();
  const matrix_id = document.getElementById('matrix_id').value.trim();
  const ims_brick = document.getElementById('ims_brick').value.trim();

  if (!hcp || !matrix_id) {
    addDoctorMessage.textContent = 'Please fill in all required fields.';
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('hcp')
      .insert([{
        hcp: hcp,
        matrix_id: matrix_id,
        ims_brick: ims_brick,
        usercode_add: evaUser.code,
        username_add: evaUser.name
      }])
      .select();

    if (error) {
      if (error.code === '23505') {
        addDoctorMessage.textContent = 'Matrix ID must be unique. This ID already exists.';
      } else {
        addDoctorMessage.textContent = `Error: ${error.message}`;
      }
      return;
    }

    addDoctorMessage.style.color = 'lightgreen';
    addDoctorMessage.textContent = 'Doctor added successfully!';
    addDoctorForm.reset();

    setTimeout(() => {
      addDoctorPopup.style.display = 'none';
      addDoctorMessage.style.color = 'red';
    }, 1500);

  } catch (err) {
    addDoctorMessage.textContent = 'Unexpected error. Try again.';
    console.error(err);
  }
});