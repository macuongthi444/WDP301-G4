import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, X, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

const TutorSyllabus = () => {
  const navigate = useNavigate();

  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);

  // Search/filter
  const [query, setQuery] = useState("");
  const [hasFileFilter, setHasFileFilter] = useState("ALL");

  // Modal tạo mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    version: "1.0",
    gradeLevel: "",
    subject: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      setError(null);
      // const res = await api.get("/syllabus");
      const [sylRes, classRes] = await Promise.all([
        api.get("/syllabus"),
        api.get("/class"),           // ← fetch danh sách lớp
      ]);
      setSyllabi(sylRes.data.data || []);
      setClasses(classRes.data.data || []); // giả sử response có { data: [...] }
    } catch (err) {
      setError("Không thể tải danh sách giáo trình");
      setSyllabi([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
  e.preventDefault();
  if (!formData.title.trim()) {
    setCreateError("Tiêu đề là bắt buộc");
    return;
  }

  setCreating(true);
  setCreateError(null);

  try {
    const payload = {
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      version: formData.version?.trim() || "1.0",
      gradeLevel: formData.gradeLevel || undefined,
      subject: formData.subject?.trim() || undefined,
    };

    const res = await api.post("/syllabus", payload);
    console.log("Response từ server:", res.data); // debug

    // reset form
    setFormData({
      title: "",
      description: "",
      version: "1.0",
      gradeLevel: "",
      subject: "",
      classLevel: [],
    });
    setIsAddModalOpen(false);
    await fetchSyllabi();
  } catch (err) {
    console.error("Lỗi tạo syllabus:", err);
    setCreateError(
      err.response?.data?.message || "Tạo giáo trình thất bại"
    );
  } finally {
    setCreating(false);
  }
};

  const visibleSyllabi = useMemo(() => {
    const q = query.trim().toLowerCase();
    return syllabi
      .filter((syl) => {
        if (hasFileFilter === "WITH_FILE") return (syl.file_resources?.length || 0) > 0;
        if (hasFileFilter === "WITHOUT_FILE") return (syl.file_resources?.length || 0) === 0;
        return true;
      })
      .filter((syl) => {
        if (!q) return true;
        const hay = [
          syl.title || "",
          syl.description || "",
          syl.version || "",
          syl.gradeLevel || "",
          syl.subject || "",
          (syl.classLevel || []).map(cls => cls?.name || cls?.code || "").join(" "),
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
  }, [syllabi, query, hasFileFilter]);


  // ── MOVE THIS UP HERE ──
  const handleClassSelectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((option) => option.value);
    setFormData((prev) => ({ ...prev, classLevel: selected }));
  };
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-8 w-8 text-slate-900" />
          <h1 className="text-3xl font-extrabold text-slate-900">Quản lý giáo trình</h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-indigo-500 px-6 py-3 font-semibold text-white shadow hover:brightness-95"
        >
          <Plus size={18} /> Thêm giáo trình
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Search + Filter */}
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm theo tiêu đề, môn, khối, lớp..."
          className="w-full md:max-w-[420px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={hasFileFilter}
          onChange={(e) => setHasFileFilter(e.target.value)}
          className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">Tất cả</option>
          <option value="WITH_FILE">Có tài liệu</option>
          <option value="WITHOUT_FILE">Không có tài liệu</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-4 bg-slate-100 px-6 py-4 text-base font-extrabold text-slate-800">
          <div className="col-span-4">Tiêu đề & Thông tin</div>
          <div className="col-span-2">Khối / Môn</div>
          <div className="col-span-2">Lớp học</div>
          <div className="col-span-2">Phiên bản</div>
          <div className="col-span-2">Tài liệu</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-slate-700" />
          </div>
        ) : visibleSyllabi.length === 0 ? (
          <div className="py-16 text-center text-slate-500">Chưa có giáo trình nào</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleSyllabi.map((syl) => {
              const fileCount = syl.file_resources?.length || 0;
              return (
                <button
                  key={syl._id}
                  onClick={() => navigate(`/tutor/syllabus/${syl._id}`)}
                  className="grid w-full grid-cols-12 gap-4 px-6 py-5 text-left hover:bg-slate-50 transition"
                >
                  <div className="col-span-4">
                    <div className="font-semibold text-slate-900">{syl.title}</div>
                    {syl.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {syl.description}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-slate-700">
                    {syl.gradeLevel && <div>{syl.gradeLevel}</div>}
                    {syl.subject && <div className="font-medium">{syl.subject}</div>}
                  </div>
                  <div className="col-span-2 text-sm text-slate-700">
                    {syl.classLevel?.length > 0
                      ? syl.classLevel.map(cls => cls.name || cls.code || "Lớp").join(", ")
                      : "Chưa gán lớp"}
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-slate-900">
                    {syl.version || "1.0"}
                  </div>
                  <div className="col-span-2 text-sm text-slate-700">
                    {fileCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <FileText size={14} className="mr-1" />
                        {fileCount} tài liệu
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Không có
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Tạo mới - ĐÃ THÊM CÁC TRƯỜNG MỚI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => !creating && setIsAddModalOpen(false)}
              disabled={creating}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900">Tạo giáo trình mới</h2>
            <p className="mt-1 text-sm text-slate-500 mb-6">Điền thông tin để tạo syllabus</p>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={creating}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  placeholder="Ví dụ: Giáo trình Toán 10 - Cơ bản"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Khối học</label>
                  <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleInputChange}
                    disabled={creating}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  >
                    <option value="">Chọn khối</option>
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                    <option value="Đại học">Đại học</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Môn học</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={creating}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                    placeholder="Toán, Văn, Lý, Hóa..."
                  />
                </div>
              </div>

              

              <div>
                <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={creating}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  placeholder="Mô tả ngắn gọn về giáo trình..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Phiên bản</label>
                <input
                  type="text"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  disabled={creating}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  placeholder="1.0"
                />
              </div>

              {createError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => !creating && setIsAddModalOpen(false)}
                  disabled={creating}
                  className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? "Đang tạo..." : "Tạo giáo trình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorSyllabus;