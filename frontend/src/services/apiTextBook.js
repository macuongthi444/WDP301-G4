import api from "./api";

/* ================================
   SYLLABUS APIs
================================ */

export const getMySyllabiApi = () => {
    return api.get("/syllabus");
};

export const getSyllabusDetailApi = (id) => {
    return api.get(`/syllabus/${id}`);
};

export const createSyllabusApi = (payload) => {
    return api.post("/syllabus", payload);
};

export const updateSyllabusApi = (id, payload) => {
    return api.put(`/syllabus/${id}`, payload);
};

export const deleteSyllabusApi = (id) => {
    return api.delete(`/syllabus/${id}`);
};


/* ================================
   FILE RESOURCE APIs (ĐÚNG BE)
================================ */

// Upload file
export const uploadFileApi = (formData) => {
    return api.post("/file-resources/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

// Lấy file theo syllabus
export const getFilesByOwnerApi = (ownerType, ownerId) => {
    return api.get(
        `/file-resources?ownerType=${ownerType}&ownerId=${ownerId}`
    );
};

// Xóa file
export const deleteFileApi = (id) => {
    return api.delete(`/file-resources/${id}`);
};