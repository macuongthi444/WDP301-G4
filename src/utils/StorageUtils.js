import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
/**
 * Utility functions for Firebase Storage management.
 */
export const StorageUtils = {
  /**
   * Helper to identify if a file is an image based on extension.
   */
  isImage: (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
  },

  /**
   * Predicts the thumbnail path for a given storage path.
   * Assumes the naming convention is originalName_200x200.ext
   */
  getThumbnailPath: (filePath) => {
    if (!filePath) return null;
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex === -1) return filePath + '_200x200';
    
    return filePath.substring(0, lastDotIndex) + '_200x200' + filePath.substring(lastDotIndex);
  }
};

export default StorageUtils;
