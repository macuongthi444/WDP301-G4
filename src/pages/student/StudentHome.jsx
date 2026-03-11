import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StudentNavbar from '../../components/student/StudentNavbar';
import Footer from '../../components/shared/Footer';
import StudentHomeHero from '../../components/student/StudentHomeHero';

function StudentHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch student profile based on UID
        const userRef = ref(db, `users/${currentUser.uid}`);
        get(userRef).then(async (snapshot) => {
          if (snapshot.exists()) {
            let userData = snapshot.val();
            let { tutorId, studentId } = userData;

            // --- DEEP SEARCH FALLBACK ---
            if (!tutorId || !studentId) {
               const allStudentsSnap = await get(ref(db, 'students'));
               if (allStudentsSnap.exists()) {
                  const allTutorsData = allStudentsSnap.val();
                  for (const [tId, studentsList] of Object.entries(allTutorsData)) {
                     for (const [sId, studentObj] of Object.entries(studentsList)) {
                        if (studentObj.studentAuthId === currentUser.uid) {
                           tutorId = tId;
                           studentId = sId;
                           await update(userRef, { tutorId, studentId });
                           break;
                        }
                     }
                     if (tutorId) break;
                  }
               }
            }

            if (tutorId && studentId) {
               // Fetch detailed profile from /students tree
               onValue(ref(db, `students/${tutorId}/${studentId}`), (snap) => {
                  setStudentProfile({ ...snap.val(), tutorId, studentId });
               });
            } else {
               setStudentProfile(userData);
            }
          }
        });
      }
      else navigate('/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  const displayName = studentProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'A';

  return (
    <>
      <StudentNavbar activePage="home" />

      {/* Analytics Content */}
      <StudentHomeHero 
        displayName={displayName} 
        studentProfile={studentProfile} 
        user={user}
      />

      <Footer />
    </>
  );
}

export default StudentHome;
