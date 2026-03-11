import { auth, db, storage, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail, getDownloadURL } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { StorageUtils } from '../../utils/StorageUtils';

/**
 * A shared component to display file thumbnails.
 * If the file is an image, it tries to load the resized version.
 * Falls back to original image or a file icon.
 */
function FileThumbnail({ filePath, fileName, fileUrl, className = "w-10 h-10 rounded-xl" }) {
  const [thumbUrl, setThumbUrl] = useState(null);
  const [error, setError] = useState(false);
  const isImage = StorageUtils.isImage(fileName);

  useEffect(() => {
    let isMounted = true;

    if (isImage && filePath) {
      const thumbnailPath = StorageUtils.getThumbnailPath(filePath);
      const thumbnailRef = ref(storage, thumbnailPath);

      getDownloadURL(thumbnailRef)
        .then((url) => {
          if (isMounted) setThumbUrl(url);
        })
        .catch(() => {
          // If thumbnail doesn't exist yet or fails, fall back to original fileUrl
          if (isMounted) setThumbUrl(fileUrl);
        });
    }

    return () => { isMounted = false; };
  }, [filePath, fileName, fileUrl, isImage]);

  if (isImage && (thumbUrl || fileUrl)) {
    return (
      <div className={`${className} bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm`}>
        <img 
          src={thumbUrl || fileUrl} 
          alt={fileName} 
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Fallback for PDF or other files
  const isPdf = fileName?.toLowerCase().endsWith('.pdf');
  
  return (
    <div className={`${className} ${isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center border border-slate-50 shadow-sm`}>
      <i className={`fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-lines'} text-lg`}></i>
    </div>
  );
}

export default FileThumbnail;
