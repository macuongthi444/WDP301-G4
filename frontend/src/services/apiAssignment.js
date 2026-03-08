import api from "./api";

export const getAssignmentsApi = () => {
    return api.get("/assignments");
};

export const getAssignmentDetailApi = (id) => {
    return api.get(`/assignments/${id}`);
};

export const createAssignmentApi = (payload) => {
    return api.post("/assignments", payload);
};

export const updateAssignmentApi = (id, payload) => {
    return api.put(`/assignments/${id}`, payload);
};

export const deleteAssignmentApi = (id) => {
    return api.delete(`/assignments/${id}`);
};

