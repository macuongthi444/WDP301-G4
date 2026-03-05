import axios from "axios";

export const uploadFileApi = (formData) => {
    return axios.post("/api/file-resources/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const getFilesByOwnerApi = (ownerType, ownerId) => {
    return axios.get(
        `/api/file-resources?ownerType=${ownerType}&ownerId=${ownerId}`
    );
};

export const deleteFileApi = (id) => {
    return axios.delete(`/api/file-resources/${id}`);
};