import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StudentNavbar from '../../components/student/StudentNavbar';
import Footer from '../../components/shared/Footer';
import StudentAnalytics from '../../components/student/StudentAnalytics';

function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // 1. Fetch user record from /users/${uid}
          const userRef = ref(db, `users/${currentUser.uid}`);
          const userSnap = await get(userRef);
          
          if (userSnap.exists()) {
            let userData = userSnap.val();
            let { tutorId, studentId } = userData;

            // --- DEEP SEARCH FALLBACK ---
            // If tutorId or studentId is missing (legacy account), search through the whole students tree
            if (!tutorId || !studentId) {
               console.log("[Dashboard] Missing tutorId/studentId. Starting Deep Search...");
               const allStudentsRef = ref(db, 'students');
               const allStudentsSnap = await get(allStudentsRef);
               
               if (allStudentsSnap.exists()) {
                  const allTutorsData = allStudentsSnap.val();
                  
                  // Loop through tutors
                  for (const [tId, studentsList] of Object.entries(allTutorsData)) {
                     // Loop through students in each tutor's list
                     for (const [sId, studentObj] of Object.entries(studentsList)) {
                        if (studentObj.studentAuthId === currentUser.uid) {
                           console.log(`[Dashboard] Found student in deep search! Tutor: ${tId}, StudentID: ${sId}`);
                           tutorId = tId;
                           studentId = sId;
                           
                           // Auto-repair the user record for next time
                           await update(userRef, { tutorId, studentId });
                           break;
                        }
                     }
                     if (tutorId) break;
                  }
               }
            }

            if (tutorId && studentId) {
               // 2. Fetch Detailed Student Profile
               const detailedProfileRef = ref(db, `students/${tutorId}/${studentId}`);
               onValue(detailedProfileRef, (studentSnap) => {
                  const detailedData = studentSnap.val();
                  if (detailedData) {
                     setStudentProfile({ ...detailedData, tutorId, studentId, email: currentUser.email });
                  } else {
                     setStudentProfile({ ...userData, tutorId, studentId });
                  }

                  // 3. Fetch Tutor details (only after we have tutorId)
                  const tutorDetailsRef = ref(db, `users/${tutorId}`);
                  onValue(tutorDetailsRef, (tutorSnap) => {
                     if (tutorSnap.exists()) {
                        setTutorProfile(tutorSnap.val());
                     }
                     setLoading(false); // FINISHED: Everything loaded
                  });
               });
            } else {
               // No link found even after deep search
               console.warn("[Dashboard] No tutor association found for this account.");
               setStudentProfile(userData);
               setLoading(false);
            }
          } else {
             setLoading(false);
          }
        } catch (error) {
           console.error("[Dashboard] Error fetching data:", error);
           setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
           <p className="text-slate-400 font-bold text-sm animate-pulse">Đang đồng bộ dữ liệu học tập...</p>
        </div>
     </div>
  );

  return (
    <div className="bg-[#f8f9fc] min-h-screen">
      <StudentNavbar activePage="dashboard" />

      {/* Analytics Content */}
      <StudentAnalytics 
         studentProfile={studentProfile} 
         tutorProfile={tutorProfile}
         user={user}
      />

      <Footer />
    </div>
  );
}

export default StudentDashboard;
