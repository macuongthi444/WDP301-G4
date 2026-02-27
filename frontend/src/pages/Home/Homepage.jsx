import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowRight } from 'lucide-react';

// Dùng ảnh placeholder tạm nếu banner thật chưa có
const bannerImage = 'https://images.unsplash.com/photo-1550617931-eb3a88e84519?auto=format&fit=crop&q=80'; 

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Giả lập load data nhanh (2 giây) để test
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Giả lập API delay

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative h-[80vh] min-h-[500px]">
        <img
          src={bannerImage}
          alt=" Banner"
          className="absolute inset-0 w-full h-full object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">Tutor Note</h1>
            <p className="text-xl md:text-3xl mb-10 font-light drop-shadow-md">
             Học Hành
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => navigate('/products')}
                className="bg-white text-gray-900 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
              >
                Khám phá ngay
              </button>
              <button
                onClick={() => navigate('/products')}
                className="border-2 border-white text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-white/20 transition"
              >
                Xem qua
                <ArrowRight className="inline ml-2" size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Thêm nội dung test để chắc chắn có gì đó hiển thị */}
      <section className="py-16 bg-gray-50 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8">Chào mừng đến với Tutor Note!</h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Hiện tại đang test giao diện. Banner và các phần khác sẽ hiển thị khi load xong.
          </p>
        </div>
      </section>

      {/* Sản phẩm nổi bật - Dùng dữ liệu giả để test */}
     

      {/* Tại sao chọn + CTA giữ nguyên */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Tại sao chọn CloudCake?</h2>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            <div>
              <h3 className="text-xl font-semibold mb-4">Tươi mới mỗi ngày</h3>
              <p className="text-gray-600">Không chất bảo quản, làm mới hàng ngày</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Tùy chỉnh theo ý bạn</h3>
              <p className="text-gray-600">Thiết kế bánh theo yêu cầu riêng</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Thợ bánh chuyên nghiệp</h3>
              <p className="text-gray-600">Đội ngũ giàu kinh nghiệm & tận tâm</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Sẵn sàng thưởng thức?</h2>
          <p className="text-xl mb-10 opacity-90">
            Khám phá ngay bộ sưu tập bánh ngọt tươi ngon của chúng tôi
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-white text-gray-900 px-12 py-5 rounded-full text-xl font-semibold hover:bg-gray-200 transition"
          >
            Xem sản phẩm ngay
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;