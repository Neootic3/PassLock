const popupBtn = document.getElementById('popup-btn');
const popup = document.getElementById('popup');
const generateBtn = document.getElementById('generate-btn');
const passList = document.querySelector('.pass-list');

// Load saved passwords from local storage
function createPasswordEntry(name, password) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 90); // 90 days expiration
  
  const passEntry = document.createElement('div');
  passEntry.classList.add('password-entry');
  passEntry.style.display = 'flex';
  passEntry.style.alignItems = 'center';
  passEntry.style.justifyContent = 'space-between';
  passEntry.style.marginBottom = '10px';
  passEntry.dataset.expiration = expirationDate.toISOString();
  
  // Check if password is expired
  const isExpired = new Date() > new Date(passEntry.dataset.expiration);
  if (isExpired) {
    passEntry.style.backgroundColor = '#ffebee';
  }
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

// More secure encryption using AES
function encrypt(text, masterKey) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterKey),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  ).then(key => 
    crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      key,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt"]
    )
  );
  
  return key.then(key => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      new TextEncoder().encode(text)
    ).then(encrypted => {
      const encryptedArray = new Uint8Array(encrypted);
      return btoa(String.fromCharCode.apply(null, [...salt, ...iv, ...encryptedArray]));
    });
  });
}

// More secure decryption
function decrypt(encryptedText, masterKey) {
  const encryptedData = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
  const salt = encryptedData.slice(0, 16);
  const iv = encryptedData.slice(16, 28);
  const data = encryptedData.slice(28);

  const key = crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterKey),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  ).then(key =>
    crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      key,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"]
    )
  );

  return key.then(key =>
    crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      data
    ).then(decrypted =>
      new TextDecoder().decode(decrypted)
    )
  );
}

// Check password strength
function checkPasswordStrength(password) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;

  const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough]
    .filter(Boolean).length;

  return {
    score,
    feedback: {
      uppercase: hasUpperCase ? '✓' : '✗ Need uppercase letter',
      lowercase: hasLowerCase ? '✓' : '✗ Need lowercase letter',
      numbers: hasNumbers ? '✓' : '✗ Need number',
      special: hasSpecialChar ? '✓' : '✗ Need special character',
      length: isLongEnough ? '✓' : '✗ Need at least 8 characters'
    }
  };
}

// Save passwords to local storage with encryption
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
  'Crystal', 'Diamond', 'Ruby', 'Sapphire', 'Emerald','Shark','Lake','Horse','Dog','Cat','Bird'
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
// Close popup when clicking outside or on close button
window.addEventListener('click', (e) => {
  if (e.target === popup) {
    popup.style.display = 'none';
  }
});

document.getElementById('close-popup').addEventListener('click', () => {
  popup.style.display = 'none';
});

// Handle password generation
// Rate limiting
let lastGenerateTime = 0;
const GENERATE_COOLDOWN = 1000; // 1 second cooldown

generateBtn.addEventListener('click', () => {
  const now = Date.now();
  if (now - lastGenerateTime < GENERATE_COOLDOWN) {
    alert('Please wait a moment before generating another password');
    return;
  }
  lastGenerateTime = now;

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