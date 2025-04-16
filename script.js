const popupBtn = document.getElementById('popup-btn');
const popup = document.getElementById('popup');
const generateBtn = document.getElementById('generate-btn');
const passList = document.querySelector('.pass-list');

// Load saved passwords from local storage
function createPasswordEntry(name, password) {
  const passEntry = document.createElement('div');
  passEntry.classList.add('password-entry');
  passEntry.style.display = 'flex';
  passEntry.style.alignItems = 'center';
  passEntry.style.justifyContent = 'space-between';
  passEntry.style.marginBottom = '10px';
  passEntry.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <p style="margin: 0"><strong>${name}:</strong> <span class="password-text">${password}</span></p>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="copyPassword('${password}')" style="background: none; border: none; cursor: pointer;">
        <i class="fas fa-copy"></i>
      </button>
      <button onclick="deletePassword(this)" style="background: none; border: none; cursor: pointer; color: #ff4444;">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  passList.appendChild(passEntry);
  passList.appendChild(document.createElement('hr'));
}

function loadSavedPasswords() {
  const savedPasswords = JSON.parse(localStorage.getItem('passwords') || '[]');
  savedPasswords.forEach(({ name, password }) => {
    createPasswordEntry(name, password);
  });
}

// Save passwords to local storage
function savePasswords() {
  const entries = Array.from(passList.querySelectorAll('.password-entry'));
  const passwords = entries.map(entry => ({
    name: entry.querySelector('strong').textContent.slice(0, -1),
    password: entry.querySelector('.password-text').textContent
  }));
  localStorage.setItem('passwords', JSON.stringify(passwords));
}

// Load saved passwords when page loads
document.addEventListener('DOMContentLoaded', loadSavedPasswords);

// Dismiss warning message
function dismissWarning() {
  const disclaimer = document.getElementById('disclaimer');
  if (disclaimer) {
    disclaimer.style.display = 'none';
  }
}

// Word lists for password generation
const words = [
  'Blue', 'Red', 'Green', 'Gold', 'Silver', 'Black', 'White',
  'Tiger', 'Lion', 'Eagle', 'Wolf', 'Bear', 'Dragon', 'Phoenix',
  'Star', 'Moon', 'Sun', 'Sky', 'Ocean', 'Mountain', 'Forest',
  'Crystal', 'Diamond', 'Ruby', 'Sapphire', 'Emerald'
];

// Generate password
function generatePassword(length, type) {
  if (type === 'weak') {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  } else if (type === 'medium') {
    // Generate word combination with underscore
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${word1}_${number}_${word2}`;
  } else {
    // Strong type with date
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const specialChars = '!@#$%^&*';
    const special = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    return `${word1}_${special}_${word2}_${date}`;
  }
}

function showError(element, message) {
  element.classList.add('error');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message show';
  errorDiv.textContent = message;

  // Remove existing error message if any
  const existingError = element.nextElementSibling;
  if (existingError && existingError.classList.contains('error-message')) {
    existingError.remove();
  }

  element.parentNode.insertBefore(errorDiv, element.nextElementSibling);
}

function clearError(element) {
  element.classList.remove('error');
  const errorDiv = element.nextElementSibling;
  if (errorDiv && errorDiv.classList.contains('error-message')) {
    errorDiv.remove();
  }
}

// Copy password function
function copyPassword(password) {
  navigator.clipboard.writeText(password);
  alert('Password copied to clipboard!');
}

// Delete password function
function deletePassword(button) {
  const entry = button.closest('div').parentElement;
  const hr = entry.nextElementSibling;
  entry.remove();
  if (hr && hr.tagName === 'HR') {
    hr.remove();
  }
  savePasswords();
}

// Show popup
popupBtn.addEventListener('click', () => {
  popup.style.display = 'block';
});
// Close popup when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === popup) {
    popup.style.display = 'none';
  }
});

// Handle password generation
generateBtn.addEventListener('click', () => {
  const nameInput = document.getElementById('pass_name');
  const lengthInput = document.querySelector('.length_input');
  const type = document.getElementById('pass_type').value;
  let hasError = false;

  // Clear previous errors
  clearError(nameInput);
  clearError(lengthInput);

  const name = nameInput.value.trim();
  const length = parseInt(lengthInput.value);

  if (!name || name === ' ') {
    showError(nameInput, 'Please enter a valid name (not empty or space)');
    hasError = true;
  }

  if (!length || length < 4) {
    showError(lengthInput, 'Length must be at least 4 characters');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  const password = generatePassword(length, type);

  createPasswordEntry(name, password);

  // Save to local storage
  savePasswords();

  // Clear form and close popup
  document.getElementById('pass_name').value = '';
  document.querySelector('.length_input').value = '';
  popup.style.display = 'none';
});

const toggleBtn = document.getElementById('toggle-btn');
let passwordsVisible = true;

// Toggle password visibility
toggleBtn.addEventListener('click', () => {
  passwordsVisible = !passwordsVisible;
  const passwords = document.querySelectorAll('.password-text');
  passwords.forEach(pass => {
    if (passwordsVisible) {
      pass.classList.remove('hidden-password');
      toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Show/Hide Passwords';
    } else {
      pass.classList.add('hidden-password');
      toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Show/Hide Passwords';
    }
  });
});
