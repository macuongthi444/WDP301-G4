import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, X, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

const TutorSyllabus = () => {
  const navigate = useNavigate();

  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/filter
  const [query, setQuery] = useState("");
  const [hasFileFilter, setHasFileFilter] = useState("ALL");

  // Modal tạo mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    version: "1.0",
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
      const res = await api.get("/syllabus");
      
      setSyllabi(res.data.data || []);
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
        description: formData.description.trim() || undefined,
        version: formData.version.trim() || "1.0",
        // file_resources: []  // nếu sau này thêm upload file thì bổ sung ở đây
      };

      await api.post("/syllabus", payload);

      // Thành công → reset form, đóng modal, refresh danh sách
      setFormData({ title: "", description: "", version: "1.0" });
      setIsAddModalOpen(false);
      await fetchSyllabi(); // refresh bất đồng bộ
    } catch (err) {
      setCreateError(
        err.response?.data?.message || "Tạo giáo trình thất bại. Vui lòng thử lại."
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
      .filter((syl) =>
        q
          ? [syl.title || "", syl.description || "", syl.version || ""]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true
      );
  }, [syllabi, query, hasFileFilter]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-7 w-7 text-slate-900" />
          <h1 className="text-3xl font-extrabold text-slate-900">Quản lý giáo trình</h1>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-indigo-500 px-6 py-3 font-semibold text-white shadow hover:brightness-95 active:brightness-90"
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
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm giáo trình..."
          className="w-full md:max-w-[380px] rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="col-span-5">Tiêu đề</div>
          <div className="col-span-3">Phiên bản</div>
          <div className="col-span-4">Tài liệu đính kèm</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-slate-700" />
          </div>
        ) : visibleSyllabi.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Chưa có giáo trình nào</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleSyllabi.map((syl) => {
              const fileCount = syl.file_resources?.length || 0;
              return (
                <button
                  key={syl._id}
                  onClick={() => navigate(`/tutor/syllabus/${syl._id}`)} // Nếu có route chi tiết
                  className="grid w-full grid-cols-12 gap-4 px-6 py-4 text-left hover:bg-slate-50"
                >
                  <div className="col-span-5 text-sm font-semibold text-slate-900">
                    {syl.title}
                    {syl.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {syl.description}
                      </p>
                    )}
                  </div>
                  <div className="col-span-3 text-sm font-semibold text-slate-900">
                    {syl.version || "1.0"}
                  </div>
                  <div className="col-span-4 text-sm text-slate-700">
                    {fileCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <FileText size={14} className="mr-1" />
                        {fileCount} tài liệu
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Không có tài liệu
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/*               MODAL TẠO MỚI (POPUP)              */}
      {/* ──────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                if (!creating) setIsAddModalOpen(false);
              }}
              disabled={creating}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900">Tạo giáo trình mới</h2>
            <p className="mt-1 text-sm text-slate-500">Điền thông tin cơ bản để bắt đầu</p>

            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-5">
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
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:bg-slate-50"
                  placeholder="Ví dụ: Giáo trình Toán 10 - Cơ bản"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={creating}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:bg-slate-50"
                  placeholder="Mô tả ngắn gọn về giáo trình này..."
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
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 disabled:bg-slate-50"
                  placeholder="1.0"
                />
              </div>

              {createError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => !creating && setIsAddModalOpen(false)}
                  disabled={creating}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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