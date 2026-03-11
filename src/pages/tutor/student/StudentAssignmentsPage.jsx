import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';
import StudentAssignments from '../../../components/tutor/StudentAssignments';

function StudentAssignmentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchData(currentUser.uid, id);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [id, navigate]);

  const fetchData = (uid, studentId) => {
    const studentRef = ref(db, `students/${uid}/${studentId}`);
    const classesRef = ref(db, `classes/${uid}`);
    const schedulesRef = ref(db, `schedules/${uid}`);
    const assignmentsRef = ref(db, `assignments/${uid}`);

    // Fetch basic student info
    onValue(studentRef, (profileSnapshot) => {
      const profileData = profileSnapshot.val() || { name: studentId };
      setStudent({ ...profileData });

      // Fetch classes, schedules, assignments to match classNames
      onValue(classesRef, (classesSnapshot) => {
        const classesData = classesSnapshot.val() || {};
        
        onValue(schedulesRef, (schedulesSnapshot) => {
          const schedulesData = schedulesSnapshot.val() || {};
          
          onValue(assignmentsRef, (assignmentsSnapshot) => {
            const assignmentsData = assignmentsSnapshot.val() || {};
            const studentAssignments = [];

            Object.entries(assignmentsData).forEach(([scheduleId, dates]) => {
              Object.entries(dates).forEach(([dateStr, assignmentsForDate]) => {
                Object.entries(assignmentsForDate).forEach(([assignmentId, assignment]) => {
                  if (assignment.selectedStudents && Array.isArray(assignment.selectedStudents)) {
                    // Match by student name or id
                    if (assignment.selectedStudents.includes(profileData.name || studentId)) {
                      let className = 'Không rõ';
                      const schedule = schedulesData[scheduleId];
                      if (schedule) {
                        const classObj = Object.values(classesData).find(c => c.name === schedule.className || c.id === schedule.classId);
                        if (classObj) className = classObj.name;
                        else if (schedule.title) className = schedule.title;
                      }

                      studentAssignments.push({
                        id: assignmentId,
                        scheduleId,
                        date: dateStr,
                        className,
                        ...assignment
                      });
                    }
                  }
                });
              });
            });

            studentAssignments.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
            setAssignments(studentAssignments);
            setLoading(false);
          });
        });
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <>
      <TutorNavbar activePage="students" />
      <main className="pt-[68px] min-h-screen bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          
          {/* Breadcrumb / Back button */}
          <Link to={`/student-detail/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-6 transition-colors">
            <i className="fa-solid fa-arrow-left"></i>
            Quay lại Hồ sơ
          </Link>

          <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[32px] p-10 border border-slate-100">
            <StudentAssignments student={student} assignments={assignments} />
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

export default StudentAssignmentsPage;
