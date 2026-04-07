import bannerHero from "../assets/images/PC/BANNER/hero.jpg";
import bannerAi1 from "../assets/images/PC/BANNER/ai-banner-1.jpg";
import bannerAi2 from "../assets/images/PC/BANNER/ai-banner-2.jpg";
import bannerRamCpu from "../assets/images/PC/BANNER/ram-va-cpu-cai-nao-quan-trong-hon-thumb_e6d531798a364661858d24e93c27bd06_grande.jpg";

export const BLOG_POSTS = [
  {
    id: "blog-01",
    slug: "huong-dan-build-pc-choi-game-2k",
    title: "Hướng dẫn build PC chơi game 2K mượt và tối ưu ngân sách",
    excerpt: "Cách chọn CPU, VGA, RAM và nguồn phù hợp để đạt hiệu năng tốt cho game eSports và AAA.",
    coverImage: bannerHero,
    category: "Build PC",
    publishedAt: "2026-04-05",
    readMinutes: 7,
    content: [
      "Khi build PC chơi game 2K, bộ đôi CPU và VGA quyết định phần lớn trải nghiệm thực tế.",
      "RAM nên ưu tiên 32GB nếu bạn vừa chơi game vừa làm việc đa nhiệm hoặc stream.",
      "Nguồn máy tính cần chọn đúng công suất thực, ưu tiên từ 650W trở lên cho cấu hình có card rời.",
      "Đừng bỏ qua airflow của case và tản nhiệt CPU để máy giữ hiệu năng ổn định lâu dài.",
    ],
  },
  {
    id: "blog-02",
    slug: "so-sanh-ram-ddr4-va-ddr5",
    title: "So sánh RAM DDR4 và DDR5: nên chọn gì trong năm 2026?",
    excerpt: "Phân tích khác biệt bus RAM, độ trễ và hiệu năng thực tế cho gaming và đồ họa.",
    coverImage: bannerRamCpu,
    category: "Linh kiện",
    publishedAt: "2026-04-04",
    readMinutes: 6,
    content: [
      "DDR5 có lợi thế băng thông lớn hơn DDR4 trên nền tảng mới.",
      "Với nhu cầu gaming thuần, DDR4 bus cao vẫn là lựa chọn tiết kiệm nếu bạn đang dùng nền tảng cũ.",
      "Khi chọn RAM, cần xem cả bus, timing và khả năng tương thích mainboard.",
      "Khuyến nghị: cấu hình mới nên ưu tiên DDR5 6000 trở lên và dung lượng từ 32GB.",
    ],
  },
  {
    id: "blog-03",
    slug: "toi-uu-goc-lam-viec-setup",
    title: "Tối ưu góc làm việc và gaming setup gọn gàng",
    excerpt: "Mẹo cable management, bố trí màn hình và phụ kiện để góc máy đẹp và dễ thao tác.",
    coverImage: bannerAi1,
    category: "Setup",
    publishedAt: "2026-04-02",
    readMinutes: 5,
    content: [
      "Một setup đẹp bắt đầu từ cách bố trí và tư thế sử dụng.",
      "Khay giấu dây, dây rút và tay đỡ màn hình giúp không gian gọn gàng hơn rất nhiều.",
      "Nếu dùng nhiều ngoại vi, nên thêm hub hoặc dock để tối ưu kết nối và tiết kiệm diện tích.",
      "Đèn nền và tone màu đồng bộ giúp setup có điểm nhấn mà vẫn dễ chịu khi dùng lâu.",
    ],
  },
  {
    id: "blog-04",
    slug: "checklist-truoc-khi-thanh-toan-online",
    title: "Checklist trước khi thanh toán online cho đơn linh kiện",
    excerpt: "Những điều cần kiểm tra trước khi quét QR hoặc chuyển khoản để tránh sai mã đơn.",
    coverImage: bannerAi2,
    category: "Thanh toán",
    publishedAt: "2026-04-01",
    readMinutes: 4,
    content: [
      "Kiểm tra đúng mã đơn hàng và tổng tiền hiển thị trên trang xác nhận.",
      "Khi chuyển khoản, nội dung cần giữ đúng theo mã hệ thống sinh ra.",
      "Sau thanh toán, giữ trang xác nhận mở để hệ thống đồng bộ callback.",
      "Nếu đơn chưa đổi trạng thái, liên hệ hỗ trợ và cung cấp mã đơn để kiểm tra log.",
    ],
  },
];

export const getBlogBySlug = (slug) => BLOG_POSTS.find((post) => String(post.slug) === String(slug)) || null;
