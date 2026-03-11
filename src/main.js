import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import './style.css'

// Add simple scroll effect to header
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.style.background = 'rgba(255, 255, 255, 0.95)';
    header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    header.style.position = 'fixed';
  } else {
    header.style.background = 'transparent';
    header.style.boxShadow = 'none';
    header.style.position = 'absolute';
  }
});

// Simple animation for numbers in the revenue card
document.addEventListener('DOMContentLoaded', () => {
    // We could add count-up animations here if we wanted
    console.log("Sổ tay Gia sư Home Page Initialized");
});
