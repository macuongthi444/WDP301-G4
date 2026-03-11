// Mock Firebase Implementation for Frontend-Only Mode

const MOCK_USERS = {
  'tutor@gmail.com': { uid: 'tutor-123', displayName: 'Gia sư mẫu (Hùng)', email: 'tutor@gmail.com', role: 'tutor' },
  'student@gmail.com': { 
    uid: 'student-456', 
    displayName: 'Học sinh mẫu (An)', 
    email: 'student@gmail.com', 
    role: 'student',
    tutorId: 'tutor-123',
    studentId: 'student-456'
  }
};

export let auth = {
  currentUser: null // Initially not logged in
};

// Auto-login to tutor by default if needed, or keep it null to test login page
auth.currentUser = MOCK_USERS['tutor@gmail.com'];

export const db = {};

export const onAuthStateChanged = (authObj, callback) => {
  callback(auth.currentUser);
  return () => { }; // Unsubscribe no-op
};

export const signOut = async () => {
  console.log("Mock Sign Out");
  auth.currentUser = null;
  return Promise.resolve();
};

export const signInWithEmailAndPassword = async (authObj, email, password) => {
  console.log("Mock Sign In:", email, password);
  if (MOCK_USERS[email] && password === '123123') {
    auth.currentUser = MOCK_USERS[email];
    return Promise.resolve({ user: auth.currentUser });
  }
  return Promise.reject({ code: 'auth/wrong-password', message: 'Sai email hoặc mật khẩu.' });
};

export const createUserWithEmailAndPassword = async (authObj, email, password) => {
  return Promise.resolve({ user: { uid: 'new-user-' + Math.random(), email } });
};

export const signInWithPopup = async () => {
  auth.currentUser = MOCK_USERS['tutor@gmail.com'];
  return Promise.resolve({ user: auth.currentUser });
};

export const updateProfile = async (user, data) => {
  if (user) Object.assign(user, data);
  return Promise.resolve();
};

export class GoogleAuthProvider {
  constructor() {
    this.name = 'google.com';
  }
}

export const ref = (dbObj, path) => {
  return { path };
};

// Mock data store
const mockData = {
  'users': {
    'tutor-123': MOCK_USERS['tutor@gmail.com'],
    'student-456': MOCK_USERS['student@gmail.com']
  },
  'classes': {
    'tutor-123': {
      'class-1': { id: 'class-1', name: 'Toán 12 - Nâng cao', subject: 'Toán học', grade: '12', studentCount: 5, status: 'active', curriculum: 'syl-1' },
      'class-2': { id: 'class-2', name: 'Lý 11 - Cơ bản', subject: 'Vật lý', grade: '11', studentCount: 3, status: 'active', curriculum: 'syl-2' }
    }
  },
  'students': {
    'tutor-123': {
      'student-456': { id: 'student-456', name: 'Nguyễn Văn An', email: 'student@gmail.com', grade: '12', status: 'active' },
      'student-2': { id: 'student-2', name: 'Trần Thị Bình', email: 'thib@example.com', grade: '11', status: 'active' }
    }
  },
  'syllabuses': {
    'tutor-123': {
      'syl-1': { id: 'syl-1', name: 'Giải tích 12 - Chương 1', subject: 'Toán học', grade: '12', uploadDate: new Date().toISOString(), fileName: 'giai-tich-12.pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
      'syl-2': { id: 'syl-2', name: 'Quang học 11', subject: 'Vật lý', grade: '11', uploadDate: new Date().toISOString(), fileName: 'vat-ly-11.pdf' }
    }
  },
  'schedules': {
    'tutor-123': {
      'sch-1': { id: 'sch-1', dayOfWeek: 'T2', time: '08:00', classId: 'class-1' },
      'sch-2': { id: 'sch-2', dayOfWeek: 'T4', time: '14:00', classId: 'class-2' }
    },
    'student-456': {
      // Student's view of schedules usually fetched by tutorId, handled in onValue
    }
  },
  'attendance': {
    'tutor-123': {}
  },
  'payments': {
    'tutor-123': {}
  },
  'paymentInfo': {
    'tutor-123': {
      bankName: 'Vietcombank',
      bankBin: '970436',
      accountNumber: '123456789',
      accountName: 'NGUYEN VAN A',
      accountHolder: 'NGUYEN VAN A'
    }
  }
};

export const onValue = (refObj, callback) => {
  const parts = refObj.path.split('/').filter(p => p !== '');
  let data = mockData;
  for (const part of parts) {
    if (data && data[part]) {
      data = data[part];
    } else {
      data = null;
      break;
    }
  }

  callback({
    val: () => data,
    exists: () => data !== null && data !== undefined
  });
  return () => { }; // Unsubscribe no-op
};

export const get = async (refObj) => {
  const parts = refObj.path.split('/').filter(p => p !== '');
  let data = mockData;
  for (const part of parts) {
    if (data && data[part]) {
      data = data[part];
    } else {
      data = null;
      break;
    }
  }

  return Promise.resolve({
    val: () => data,
    exists: () => data !== null && data !== undefined
  });
};

export const set = async () => Promise.resolve();
export const update = async () => Promise.resolve();
export const push = (refObj, data) => ({ key: 'mock-key-' + Math.random().toString(36).substr(2, 9) });
export const remove = async () => Promise.resolve();

export const storage = {};
export const getDownloadURL = async (refObj) => Promise.resolve("https://via.placeholder.com/150");
export const uploadBytes = async () => Promise.resolve({ ref: { fullPath: 'mock-path' } });
export const uploadBytesResumable = (refObj, data) => ({
  on: (event, progress, error, complete) => {
    progress({ bytesTransferred: 100, totalBytes: 100 });
    complete();
  },
  snapshot: { ref: { fullPath: 'mock-path' } }
});
export const deleteObject = async () => Promise.resolve();

export { ref as sRef, ref as storageRef };

// Other hooks/services no-ops
export const usePushNotifications = () => ({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => { },
  markAllAsRead: () => { }
});

export const useScheduleReminders = () => { };
export const useTutorScheduleReminders = () => { };
export const onIdTokenChanged = () => () => { };
export const sendPasswordResetEmail = async () => Promise.resolve();
export const StorageUtils = {
  save: () => { },
  load: () => null,
  remove: () => { },
  isImage: (name) => name?.match(/\.(jpg|jpeg|png|gif|svg)$/i),
  getThumbnailPath: (path) => path
};
