// src/pages/tutor/TutorAssignments.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { BookOpen, Plus, Edit, Trash2, Clock, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';

const TutorAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [syllabi, setSyllabi] = useState([]); // Danh sách giáo trình để chọn
    const [classes, setClasses] = useState([]);   // ← thêm dòng này
    const [sessions, setSessions] = useState([]); // ← đã có fetch nhưng thiếu state
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        draft: 0,
        closed: 0,
        totalSubmissions: 0,
        overdue: 0,
        graded: 0,
    });

    // Modal Create
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        due_at: '',
        class_id: '',
        session_id: '',
        syllabus_id: '',
        generated_by_ai: false,
        ai_prompt: '',
    });

    // Fetch assignments + syllabi
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch assignments
                const assRes = await api.get('/assignments');
                const assData = assRes.data;

                let totalSubs = 0;
                let overdueCount = 0;
                let gradedCount = 0;

                assData.forEach((ass) => {
                    if (ass.submission_stats) {
                        totalSubs += ass.submission_stats.total || 0;
                        gradedCount += ass.submission_stats.graded || 0;
                        if (ass.due_at && new Date(ass.due_at) < new Date() && ass.status !== 'CLOSED') {
                            overdueCount += (ass.submission_stats.submitted || 0) + (ass.submission_stats.draft || 0);
                        }
                    }
                });

                setAssignments(assData);
                setStats({
                    total: assData.length,
                    published: assData.filter(a => a.status === 'PUBLISHED').length,
                    draft: assData.filter(a => a.status === 'DRAFT').length,
                    closed: assData.filter(a => a.status === 'CLOSED').length,
                    totalSubmissions: totalSubs,
                    overdue: overdueCount,
                    graded: gradedCount,
                });

                // Fetch danh sách giáo trình để chọn syllabus_id
                const sylRes = await api.get('/syllabus');
                setSyllabi(sylRes.data.data || []); // giả sử response giống TutorSyllabus
                const sesRes = await api.get('/teaching-sessions');
                const sessionsData = sesRes.data?.data || sesRes.data || [];
                setSessions(sessionsData);
                const classRes = await api.get('/class');           // sửa endpoint cho đúng
                setClasses(classRes.data.data || classRes.data || []);
            } catch (err) {
                console.error(err);
                alert('Không tải được dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!createForm.title.trim()) {
            alert('Tiêu đề không được để trống');
            return;
        }
        if (!createForm.class_id) {
            alert('Vui lòng chọn lớp học');
            return;
        }

        setCreating(true);

        try {
            const res = await api.post('/assignments', createForm);
            setAssignments([res.data.assignment, ...assignments]);
            alert('Tạo bài tập thành công');
            setIsCreateModalOpen(false);

            // Reset form
            setCreateForm({
                title: '',
                description: '',
                due_at: '',
                class_id: '',
                session_id: '',
                syllabus_id: '',
                generated_by_ai: false,
                ai_prompt: '',
            });
        } catch (err) {
            alert('Tạo thất bại: ' + (err.response?.data?.message || 'Lỗi không xác định'));
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa bài tập này?')) return;
        try {
            await api.delete(`/assignments/${id}`);
            setAssignments(assignments.filter(a => a._id !== id));
            alert('Xóa thành công');
        } catch (err) {
            alert('Xóa thất bại');
        }
    };

    const handlePublish = async (id) => {
        try {
            await api.put(`/assignments/${id}/publish`);
            setAssignments(assignments.map(a =>
                a._id === id ? { ...a, status: 'PUBLISHED' } : a
            ));
            alert('Đã giao bài tập');
        } catch (err) {
            alert('Giao bài thất bại');
        }
    };

    if (loading) return <div className="text-center py-10">Đang tải...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <BookOpen className="text-purple-600" size={32} />
                        Quản lý Bài tập
                    </h1>
                    <p className="text-gray-600 mt-1">Tạo, giao và theo dõi bài tập cho học sinh</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition"
                >
                    <Plus size={20} /> Tạo bài tập mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                <StatCard icon={<BookOpen size={24} />} title="Tổng bài tập" value={stats.total} color="bg-blue-100 text-blue-800" />
                <StatCard icon={<CheckCircle size={24} />} title="Đã giao" value={stats.published} color="bg-green-100 text-green-800" />
                <StatCard icon={<Clock size={24} />} title="Nháp (DRAFT)" value={stats.draft} color="bg-yellow-100 text-yellow-800" />
                <StatCard icon={<AlertCircle size={24} className="text-red-600" />} title="Tổng bài nộp" value={stats.totalSubmissions} color="bg-indigo-100 text-indigo-800" />
                <div className="grid grid-cols-1 gap-4">
                    <MiniStat title="Quá hạn" value={stats.overdue} color="text-red-600" bg="bg-red-50" />
                    <MiniStat title="Đã chấm" value={stats.graded} color="text-green-600" bg="bg-green-50" />
                </div>
            </div>

            {/* Danh sách bài tập */}
            {assignments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                    <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">Chưa có bài tập nào</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-purple-600 hover:underline mt-2 inline-block"
                    >
                        Tạo bài tập đầu tiên
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map((ass) => (
                        <AssignmentCard
                            key={ass._id}
                            assignment={ass}
                            onDelete={() => handleDelete(ass._id)}
                            onPublish={() => handlePublish(ass._id)}
                        />
                    ))}
                </div>
            )}

            {/* Modal Tạo bài tập - backdrop nhẹ như TutorSyllabus */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-md p-4">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => !creating && setIsCreateModalOpen(false)}
                            disabled={creating}
                            className="absolute right-6 top-6 rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            <Plus className="text-purple-600" size={28} />
                            Tạo bài tập mới
                        </h2>
                        <p className="text-sm text-gray-500 mb-8">Điền thông tin để tạo bài tập cho học sinh</p>

                        <form onSubmit={handleCreateSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                                    placeholder="Ví dụ: Bài tập Toán lớp 10 - Tuần 5"
                                    required
                                    disabled={creating}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả bài tập</label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                                    placeholder="Mô tả yêu cầu, hướng dẫn làm bài..."
                                    disabled={creating}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp</label>
                                    <input
                                        type="datetime-local"
                                        value={createForm.due_at}
                                        onChange={(e) => setCreateForm({ ...createForm, due_at: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                                        disabled={creating}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lớp học <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={createForm.class_id}
                                        onChange={(e) => setCreateForm({ ...createForm, class_id: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                                        required
                                        disabled={creating}
                                    >
                                        <option value="">Chọn lớp</option>
                                        {classes.map((cl) => (
                                            <option key={cl._id} value={cl._id}>
                                                {cl.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Buổi học (tùy chọn)</label>
                                    <select
                                        value={createForm.session_id}
                                        onChange={(e) => setCreateForm({ ...createForm, session_id: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                                        disabled={creating}
                                    >
                                        <option value="">Không liên kết</option>
                                        {sessions.map((ses) => (
                                            <option key={ses._id} value={ses._id}>
                                                {ses.location }
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giáo trình liên quan</label>
                                    <select
                                        value={createForm.syllabus_id}
                                        onChange={(e) => setCreateForm({ ...createForm, syllabus_id: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                                        disabled={creating}
                                    >
                                        <option value="">Không liên kết</option>
                                        {syllabi.map((syl) => (
                                            <option key={syl._id} value={syl._id}>
                                                {syl.title} {syl.version ? `(v${syl.version})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="ai-generate"
                                    checked={createForm.generated_by_ai}
                                    onChange={(e) => setCreateForm({ ...createForm, generated_by_ai: e.target.checked })}
                                    className="h-5 w-5 text-purple-600 rounded border-gray-300"
                                    disabled={creating}
                                />
                                <label htmlFor="ai-generate" className="text-sm font-medium text-gray-700">
                                    Tạo nội dung bằng AI
                                </label>
                            </div>

                            {createForm.generated_by_ai && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt cho AI</label>
                                    <textarea
                                        value={createForm.ai_prompt}
                                        onChange={(e) => setCreateForm({ ...createForm, ai_prompt: e.target.value })}
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50"
                                        placeholder="Ví dụ: Tạo 5 bài tập về phương trình bậc hai lớp 10, có đáp án chi tiết"
                                        disabled={creating}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => !creating && setIsCreateModalOpen(false)}
                                    disabled={creating}
                                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-purple-400"
                                >
                                    {creating && <Loader2 className="h-5 w-5 animate-spin" />}
                                    {creating ? 'Đang tạo...' : 'Tạo bài tập'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Component Stat Card
const StatCard = ({ icon, title, value, color }) => (
    <div className={`p-6 rounded-xl shadow-sm border ${color}`}>
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-lg shadow">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    </div>
);

// Mini Stat nhỏ hơn cho Quá hạn & Đã chấm
const MiniStat = ({ title, value, color, bg }) => (
    <div className={`p-4 rounded-lg ${bg} border`}>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
);

// Card cho từng bài tập
const AssignmentCard = ({ assignment, onDelete, onPublish }) => {
    const isOverdue = assignment.due_at && new Date(assignment.due_at) < new Date() && assignment.status !== 'CLOSED';

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{assignment.title}</h3>
                    <Badge status={assignment.status} />
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{assignment.description || 'Không có mô tả'}</p>

                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Hạn nộp: {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString('vi-VN') : 'Không hạn'}</span>
                    </div>
                    {assignment.submission_stats && (
                        <>
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} />
                                <span>Tổng nộp: {assignment.submission_stats.total}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-600" />
                                <span>Đã chấm: {assignment.submission_stats.graded}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <Link
                    to={`/tutor/assignments/${assignment._id}/edit`}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <Edit size={16} /> Sửa
                </Link>
                {assignment.status === 'DRAFT' && (
                    <button
                        onClick={onPublish}
                        className="text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                        <CheckCircle size={16} /> Giao bài
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                    <Trash2 size={16} /> Xóa
                </button>
            </div>
        </div>
    );
};

// Badge status
const Badge = ({ status }) => {
    const colors = {
        DRAFT: 'bg-yellow-100 text-yellow-800',
        PUBLISHED: 'bg-green-100 text-green-800',
        CLOSED: 'bg-gray-100 text-gray-800',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
            {status === 'DRAFT' ? 'Nháp' : status === 'PUBLISHED' ? 'Đã giao' : 'Đóng'}
        </span>
    );
};

export default TutorAssignments;