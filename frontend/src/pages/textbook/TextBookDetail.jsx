import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getSyllabusDetailApi,
    updateSyllabusApi,
    deleteSyllabusApi,
} from "../../services/apiTextBook";

import {
    getFilesByOwnerApi,
    uploadFileApi,
    deleteFileApi,
} from "../../services/apiFileResource";

export default function TextBookDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [openEdit, setOpenEdit] = useState(false);
    const [loading, setLoading] = useState(true);

    const [textbook, setTextbook] = useState(null);
    const [files, setFiles] = useState([]);
    const [fileUpload, setFileUpload] = useState(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            setLoading(true);

            // 1️⃣ Lấy syllabus
            const res = await getSyllabusDetailApi(id);
            const data = res.data.data;
            console.log(data);


            setTextbook(data);
            setTitle(data.title || "");
            setDescription(data.description || "");

            // 2️⃣ Lấy file riêng
            const fileRes = await getFilesByOwnerApi("SYLLABUS", id);
            setFiles(fileRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Update title + description
    const handleUpdate = async () => {
        try {
            await updateSyllabusApi(id, {
                title,
                description,
            });

            setOpenEdit(false);
            fetchDetail();
        } catch (err) {
            console.error(err);
        }
    };

    // Upload file
    const handleUploadFile = async () => {
        if (!fileUpload) return;

        try {
            const formData = new FormData();
            formData.append("file", fileUpload);
            formData.append("ownerType", "SYLLABUS");
            formData.append("ownerId", id);

            await uploadFileApi(formData);

            setFileUpload(null);
            fetchDetail();
        } catch (err) {
            console.error(err);
        }
    };

    // Delete file
    const handleDeleteFile = async (fileId) => {
        try {
            await deleteFileApi(fileId);
            fetchDetail();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa giáo trình này?")) return;

        try {
            await deleteSyllabusApi(id);
            navigate("/textbooks");
        } catch (err) {
            console.error(err);
        }
    };

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                Đang tải dữ liệu...
            </div>
        );

    if (!textbook)
        return (
            <div className="min-h-screen flex items-center justify-center">
                Không tìm thấy giáo trình
            </div>
        );

    const firstFile = files[0];

    return (
        <div className="min-h-screen bg-[#f3f4f6] p-10">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="bg-white rounded-xl shadow-sm border p-6 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">{textbook.title}</h1>

                    <button
                        onClick={() => setOpenEdit(true)}
                        className="px-4 py-2 text-sm rounded-lg bg-gray-200"
                    >
                        Sửa
                    </button>
                </div>

                {/* THÔNG TIN */}
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
                    <div>
                        <p className="text-blue-600 font-semibold">Tổng quan</p>
                        <p className="text-sm mt-1">
                            Upload:{" "}
                            {new Date(textbook.created_at).toLocaleDateString("vi-VN")}
                        </p>
                    </div>

                    <div>
                        <p className="text-blue-600 font-semibold">Ghi chú</p>
                        <p className="text-sm mt-1">
                            {textbook.description || "Chưa có ghi chú"}
                        </p>
                    </div>
                </div>

                {/* FILE LIST */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <p className="text-blue-600 font-semibold mb-3">Tài liệu</p>

                    {files.length === 0 && (
                        <p className="text-sm">Chưa có file</p>
                    )}

                    {files.map((file) => (
                        <div
                            key={file._id}
                            className="flex justify-between items-center border p-2 rounded mb-2"
                        >
                            <a
                                href={file.url_or_content}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 text-sm"
                            >
                                {file.file_name}
                            </a>

                            <button
                                onClick={() => handleDeleteFile(file._id)}
                                className="text-red-500 text-xs"
                            >
                                Xóa
                            </button>
                        </div>
                    ))}
                </div>

                {/* PREVIEW */}
                {firstFile && (
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <p className="text-blue-600 font-semibold mb-3">Xem trước</p>
                        <div className="border rounded-md h-[400px] bg-gray-50 overflow-hidden">
                            <iframe
                                src={firstFile.url_or_content}
                                title="preview"
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {openEdit && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-[430px] rounded-xl shadow-lg border p-6">
                        <h2 className="text-xl font-semibold text-center mb-5">
                            Cập nhật giáo trình
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm">Tên giáo trình</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm">Ghi chú</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                                />
                            </div>

                            <div>
                                <input
                                    type="file"
                                    onChange={(e) => setFileUpload(e.target.files[0])}
                                    className="text-sm"
                                />
                                <button
                                    onClick={handleUploadFile}
                                    className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded"
                                >
                                    Upload file
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm"
                            >
                                Xóa
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setOpenEdit(false)}
                                    className="px-4 py-2 rounded-lg bg-gray-200 text-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="px-5 py-2 rounded-lg text-white text-sm bg-gradient-to-r from-green-400 to-indigo-400"
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}