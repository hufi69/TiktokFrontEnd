
export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required';
  }
  
  // Trim email to remove whitespace
  const trimmedEmail = email.trim();
  
  // More strict email validation regex
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  return null;
};

/**
 * Validate password confirmation
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

/**
 * Validate OTP
 */
export const validateOTP = (otp) => {
  if (!otp) {
    return 'OTP is required';
  }
  if (otp.length !== 6) {
    return 'OTP must be 6 digits';
  }
  if (!/^\d+$/.test(otp)) {
    return 'OTP must contain only numbers';
  }
  return null;
};

/**
 * Sign up form validation
 */
export const validateSignUpForm = (formData) => {
  const errors = {};
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  if (formData.confirmPassword !== undefined) {
    const confirmError = validatePasswordConfirmation(
      formData.password, 
      formData.confirmPassword
    );
    if (confirmError) errors.confirmPassword = confirmError;
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Sign in form validation
 */
export const validateSignInForm = (formData) => {
  const errors = {};
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  if (!formData.password) {
    errors.password = 'Password is required';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Forgot password form validation
 */
export const validateForgotPasswordForm = (formData) => {
  const errors = {};
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Reset password form validation
 */
export const validateResetPasswordForm = (formData) => {
  const errors = {};
  
  const passwordError = validatePassword(formData.newPassword || formData.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmError = validatePasswordConfirmation(
    formData.newPassword || formData.password,
    formData.confirmNewPassword || formData.confirmPassword
  );
  if (confirmError) errors.confirmPassword = confirmError;
  
  return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Change password form validation
 */
export const validateChangePasswordForm = (formData) => {
  const errors = {};
  
  if (!formData.currentPassword) {
    errors.currentPassword = 'Current password is required';
  }
  
  const passwordError = validatePassword(formData.newPassword);
  if (passwordError) errors.newPassword = passwordError;
  
  const confirmError = validatePasswordConfirmation(
    formData.newPassword,
    formData.confirmNewPassword
  );
  if (confirmError) errors.confirmNewPassword = confirmError;
  
  return Object.keys(errors).length > 0 ? errors : null;
};

