import { getRequest, postRequest } from './httpClient';
import { CONFIG } from '../../config';

const MODEL_NAME = '/api/v1/auth';

export async function signUp(userData) {
  try {
    const payload = {
      email: userData.email,
      password: userData.password
    };

    const result = await postRequest(`${MODEL_NAME}/signup`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function signIn(credentials) {
  try {
    const payload = {
      email: credentials.email,
      password: credentials.password
    };

    const result = await postRequest(`${MODEL_NAME}/login`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function verifyOTP(otpData) {
  try {
    const payload = {
      otp: otpData.otp
    };

    const result = await postRequest(`${MODEL_NAME}/verify-otp`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function verifyResetPasswordOTP(otpData) {
  try {
    const payload = {
      otp: otpData.otp
    };

    const result = await postRequest(`${MODEL_NAME}/verify-reset-password-otp`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function resendOTP(email) {
  try {
    const payload = { email };
    const result = await postRequest(`${MODEL_NAME}/resend-otp`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function forgotPassword(email) {
  try {
    const payload = { email };
    const result = await postRequest(`${MODEL_NAME}/forgot-password`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function resetPassword(otp, passwordData) {
  try {
    const payload = {
      otp: otp,
      newPassword: passwordData.newPassword || passwordData.password,
      confirmNewPassword: passwordData.confirmNewPassword || passwordData.password
    };

    const result = await postRequest(`${MODEL_NAME}/reset-password`, payload);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function changePassword(passwordData) {
  try {
    const result = await postRequest(`${MODEL_NAME}/change-password`, passwordData);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function googleLogin() {
  try {
    // This would be implemented when Google OAuth is fully set up
    const result = await postRequest(`${MODEL_NAME}/google-login`);
    return result;
  } catch (err) {
    throw err;
  }
}

export async function verifyToken() {
  try {
    const result = await getRequest('/api/v1/users/getAllUsers');
    return result;
  } catch (err) {
    throw err;
  }
}
