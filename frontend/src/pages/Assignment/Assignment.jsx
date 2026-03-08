import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssignmentsApi } from "../../services/apiAssignment";

export default function Assignment() {

    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAssignments = async () => {
        try {
            setLoading(true);

            const res = await getAssignmentsApi();

            setData(res.data.data || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const renderStatus = (status) => {
        if (status === "PUBLISHED")
            return (
                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600">
                    Đã mở
                </span>
            );

        if (status === "CLOSED")
            return (
                <span className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                    Đã đóng
                </span>
            );

        return (
            <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">
                Draft
            </span>
        );
    };

    // Stats
    const total = data.length;
    const submitted = data.filter(a => a.status === "CLOSED").length;
    const published = data.filter(a => a.status === "PUBLISHED").length;
    const draft = data.filter(a => a.status === "DRAFT").length;

    return (
        <div className="min-h-screen bg-gray-100 p-8">

            <div className="max-w-6xl mx-auto space-y-6">

                <h1 className="text-2xl font-semibold">Bài tập</h1>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-6">

                    <div className="bg-white p-5 rounded-xl shadow">
                        <p className="text-sm text-gray-500">Tổng số</p>
                        <p className="text-xl font-bold">{total}</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow">
                        <p className="text-sm text-gray-500">Đã mở</p>
                        <p className="text-xl font-bold">{published}</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow">
                        <p className="text-sm text-gray-500">Đã đóng</p>
                        <p className="text-xl font-bold">{submitted}</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow">
                        <p className="text-sm text-gray-500">Draft</p>
                        <p className="text-xl font-bold">{draft}</p>
                    </div>

                </div>

                {/* Search */}
                <div className="flex gap-4">
                    <input
                        placeholder="Tìm kiếm theo tiêu đề..."
                        className="px-3 py-2 border rounded-md w-72 bg-white"
                    />

                    <select className="px-3 py-2 border rounded-md bg-white">
                        <option>Tất cả</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow overflow-hidden">

                    <table className="w-full text-sm">

                        <thead>
                            <tr className="bg-gray-200 text-left">
                                <th className="px-4 py-3">Tiêu đề</th>
                                <th className="px-4 py-3">Lớp</th>
                                <th className="px-4 py-3">Hạn nộp</th>
                                <th className="px-4 py-3">Bài nộp</th>
                                <th className="px-4 py-3">Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-6">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-6 text-gray-400">
                                        Chưa có bài tập
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr
                                        key={item._id}
                                        onClick={() => navigate(`/assignments/${item._id}`)}
                                        className="border-b hover:bg-gray-50 cursor-pointer"
                                    >

                                        <td className="px-4 py-3">{item.title}</td>

                                        <td className="px-4 py-3">
                                            {item.class_id?.name || "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.due_at
                                                ? new Date(item.due_at).toLocaleDateString("vi-VN")
                                                : "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            0/0
                                        </td>

                                        <td className="px-4 py-3">
                                            {renderStatus(item.status)}
                                        </td>

                                    </tr>
                                ))
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}