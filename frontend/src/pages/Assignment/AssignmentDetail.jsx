import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssignmentDetailApi } from "../../services/apiAssignment";

export default function AssignmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAssignment = async () => {
        try {
            const res = await getAssignmentDetailApi(id);
            setAssignment(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignment();
    }, [id]);

    if (loading) return <p>Loading...</p>;

    if (!assignment) return <p>Không tìm thấy bài tập</p>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">
                        {assignment.title}
                    </h1>

                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-full bg-gray-800 text-white text-sm">
                            Sửa
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-indigo-400 text-white text-sm"
                        >
                            Đóng
                        </button>
                    </div>
                </div>

                {/* Assignment Info */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <p className="text-sm text-gray-600">
                        {assignment.description}
                    </p>

                    <div className="mt-4 space-y-2 text-sm">
                        <p><b>Hạn nộp:</b> {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : "Không có"}</p>
                        <p><b>Trạng thái:</b> {assignment.status}</p>
                        <p><b>Tạo bởi AI:</b> {assignment.generated_by_ai ? "Có" : "Không"}</p>
                    </div>
                </div>

            </div>
        </div>
    );
}