/**
 * Profile Validation Schemas
 * Validation rules for user profile forms
 */

/**
 * Validate username
 */
export const validateUsername = (username) => {
  if (!username) {
    return null; // Username is optional
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (username.length > 30) {
    return 'Username must be less than 30 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
};

/**
 * Validate full name
 */
export const validateFullName = (fullName) => {
  if (!fullName) {
    return 'Full name is required';
  }
  if (fullName.length < 2) {
    return 'Full name must be at least 2 characters long';
  }
  if (fullName.length > 50) {
    return 'Full name must be less than 50 characters';
  }
  return null;
};

/**
 * Validate occupation
 */
export const validateOccupation = (occupation) => {
  if (!occupation) {
    return null; // Occupation is optional
  }
  if (occupation.length > 50) {
    return 'Occupation must be less than 50 characters';
  }
  return null;
};

/**
 * Validate date of birth
 */
export const validateDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null; // Date of birth is optional
  }
  
  const date = new Date(dateOfBirth);
  const now = new Date();
  const age = now.getFullYear() - date.getFullYear();
  
  if (isNaN(date.getTime())) {
    return 'Please enter a valid date';
  }
  
  if (age < 13) {
    return 'You must be at least 13 years old';
  }
  
  if (age > 120) {
    return 'Please enter a valid date of birth';
  }
  
  return null;
};

/**
 * Validate country
 */
export const validateCountry = (country) => {
  if (!country) {
    return null; // Country is optional
  }
  if (country.length < 2) {
    return 'Please select a valid country';
  }
  return null;
};

/**
 * Profile form validation
 */
export const validateProfileForm = (formData) => {
  const errors = {};
  
  if (formData.fullName !== undefined) {
    const fullNameError = validateFullName(formData.fullName);
    if (fullNameError) errors.fullName = fullNameError;
  }
  
  if (formData.username !== undefined) {
    const usernameError = validateUsername(formData.username);
    if (usernameError) errors.username = usernameError;
  }
  
  if (formData.occupation !== undefined) {
    const occupationError = validateOccupation(formData.occupation);
    if (occupationError) errors.occupation = occupationError;
  }
  
  if (formData.dateOfBirth !== undefined) {
    const dobError = validateDateOfBirth(formData.dateOfBirth);
    if (dobError) errors.dateOfBirth = dobError;
  }
  
  if (formData.country !== undefined) {
    const countryError = validateCountry(formData.country);
    if (countryError) errors.country = countryError;
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Validate profile picture
 */
export const validateProfilePicture = (image) => {
  if (!image) {
    return null; // Profile picture is optional
  }
  
  if (!image.uri) {
    return 'Invalid image file';
  }
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (image.type && !validTypes.includes(image.type)) {
    return 'Image must be JPEG, PNG, or GIF format';
  }
  
  // Check file size (5MB max)
  if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
    return 'Image size must be less than 5MB';
  }
  
  return null;
};

