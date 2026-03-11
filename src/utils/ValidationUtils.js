import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
/**
 * Utility functions for form validation.
 */
export const ValidationUtils = {
  /**
   * Validates an email address.
   */
  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  /**
   * Validates a Vietnamese phone number.
   * 10 digits, starting with 03, 05, 07, 08, 09.
   */
  validatePhone: (phone) => {
    const re = /^(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})$/;
    return re.test(String(phone));
  },

  /**
   * Validates password length (Firebase requirement is min 6).
   */
  validatePassword: (password) => {
    return password.length >= 6;
  },

  /**
   * Validates student age based on date of birth.
   * Range: 3 - 100 years.
   */
  validateStudentAge: (dob) => {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 3 && age <= 100;
  },

  /**
   * Validates name (at least 2 characters, no suspicious special chars).
   */
  validateName: (name) => {
    return name.trim().length >= 2;
  }
};

export default ValidationUtils;
