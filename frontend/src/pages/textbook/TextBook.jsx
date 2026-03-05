import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBook } from "react-icons/fa";
import {
    getMySyllabiApi,
    createSyllabusApi,
    uploadFileApi,
} from "../../services/apiTextBook";

export default function TextBook() {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [version, setVersion] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const navigate = useNavigate();

    // =========================
    // Fetch List
    // =========================
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getMySyllabiApi();
            setData(res.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // =========================
    // Create Syllabus + Upload File
    // =========================
    const handleCreate = async () => {
        if (!title.trim()) return;

        try {
            setUploading(true);

            const finalVersion = version.trim() ? version : "1.0";

            // 1️⃣ Tạo syllabus
            const syllabusRes = await createSyllabusApi({
                title,
                description,
                version: finalVersion,
            });

            const syllabusId = syllabusRes.data.data._id;

            // 2️⃣ Upload file nếu có
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", "FILE");
                formData.append("ownerType", "SYLLABUS");
                formData.append("ownerId", syllabusId);

                await uploadFileApi(formData);
            }

            // Reset form
            setOpen(false);
            setTitle("");
            setDescription("");
            setVersion("");
            setFile(null);

            fetchData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Lỗi tạo giáo trình");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 relative">
            <div className="bg-white rounded-2xl shadow-sm p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <FaBook />
                        <h1 className="text-xl font-semibold">Giáo trình</h1>
                    </div>

                    <button
                        onClick={() => setOpen(true)}
                        className="rounded-full px-5 py-2 text-sm font-medium bg-gradient-to-r from-green-400 to-indigo-400 text-white hover:opacity-90 transition"
                    >
                        + Tạo giáo trình
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700 text-left">
                                <th className="px-4 py-3 font-semibold">Tên giáo trình</th>
                                <th className="px-4 py-3 font-semibold">Phiên bản</th>
                                <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-6">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-6 text-gray-400">
                                        Chưa có giáo trình nào
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr
                                        key={item._id}
                                        onClick={() =>
                                            navigate(`/textbooks/${item._id}`)
                                        }
                                        className="border-b last:border-none hover:bg-gray-50 transition cursor-pointer"
                                    >
                                        <td className="px-4 py-3">{item.title}</td>
                                        <td className="px-4 py-3">
                                            {item.version || "1.0"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {new Date(item.created_at).toLocaleDateString(
                                                "vi-VN"
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= Modal ================= */}
            {open && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white w-[420px] rounded-2xl shadow-xl p-6">
                        <h2 className="text-2xl font-bold text-center mb-5">
                            Thêm giáo trình
                        </h2>

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="text-sm">Tên giáo trình:</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-gray-300"
                                />
                            </div>

                            {/* Version */}
                            <div>
                                <label className="text-sm">Phiên bản:</label>
                                <input
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="Ví dụ: 1.0, 2.1 (mặc định 1.0)"
                                    className="w-full mt-1 px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-gray-300"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm">Mô tả:</label>
                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    className="w-full mt-1 px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-gray-300"
                                />
                            </div>

                            {/* Upload */}
                            <div>
                                <label className="text-sm">
                                    File giáo trình:
                                </label>

                                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition">
                                    <input
                                        type="file"
                                        onChange={(e) =>
                                            setFile(e.target.files[0])
                                        }
                                        className="hidden"
                                        id="fileUpload"
                                    />

                                    <label
                                        htmlFor="fileUpload"
                                        className="cursor-pointer block"
                                    >
                                        {file ? (
                                            <p className="text-sm text-green-600">
                                                {file.name}
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-gray-400 text-lg font-semibold">
                                                    Nhấn để tải file lên
                                                </p>
                                                <div className="text-2xl mt-2">
                                                    ⬆️
                                                </div>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 rounded-full bg-gray-200 text-sm"
                            >
                                Hủy
                            </button>

                            <button
                                onClick={handleCreate}
                                disabled={uploading}
                                className="px-5 py-2 rounded-full text-sm text-white bg-gradient-to-r from-green-400 to-indigo-400 disabled:opacity-50"
                            >
                                {uploading ? "Đang xử lý..." : "Tạo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}