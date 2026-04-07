require("dotenv").config();

const { query, pool } = require("../utils/db");

const imagePools = {
  playzone: [
    "https://cdn.hstatic.net/products/200000637319/image_-_2026-03-28t143938.022_ac934d6f6b304bdc81c04d2e17603b47.png",
    "https://cdn.hstatic.net/products/200000637319/image_-_2026-03-26t164424.580_5b14867fa4484150b2d1e341c6b1408f.png",
    "https://cdn.hstatic.net/products/200000637319/image_-_2026-03-26t163422.151_fca0ee0033b6430d94088fc22cd13e3f.png",
    "https://cdn.hstatic.net/products/200000637319/image__17_-photoroom_dc49eb98784e4af38831f641c76743d7.png",
    "https://cdn.hstatic.net/products/200000637319/image__1__541c7da69d70437981d4d266829f3ed6.png",
    "https://cdn.hstatic.net/products/200000637319/image_-_2026-03-22t144002.055_bc6ba32ee30f49a1ad5fc20a07b80c66.png",
  ],
  gearvn: [
    "https://cdn.hstatic.net/products/200000722513/black__14__d457f411333043f6bcc6346864cfe931.png",
    "https://cdn.hstatic.net/products/200000722513/man-hinh-msi-mag-272qp-qd-oled-x24-27-qd-oled-2k-240hz-1_4cd3167e397a483fb4d146de0d00145c.jpg",
    "https://cdn.hstatic.net/products/200000722513/chuot-razer-khong-day-viper-v4-pro-trang-2_1f20c6c5819b484f9413fbfd6e6e0507.jpg",
    "https://cdn.hstatic.net/products/200000722513/chuot-razer-khong-day-viper-v4-pro-den-1_87e1cc28460d4463bf93f4dad931cb86.jpg",
    "https://cdn.hstatic.net/products/200000722513/laptop-asus-expertbook-b1-bm1403cda-s61611w-1_d15f47cb7de0465793f3ea3cfbfbf81a.jpg",
    "https://cdn.hstatic.net/products/200000722513/bo-vi-xu-ly-intel-core-i7-14700-2_f6a3fe7d3c9d4f5d88739188b0901740.jpg",
  ],
  phongcachxanh: [
    "https://cdn.shopify.com/s/files/1/0636/9044/0949/products/pulsar-micro-bungee-37010437570805.jpg?v=1677138502",
    "https://cdn.shopify.com/s/files/1/0636/9044/0949/products/pulsar-micro-bungee-x3-37010440061173.jpg?v=1677140097",
    "https://cdn.shopify.com/s/files/1/0636/9044/0949/products/feet-chu-t-pulsar-superglide-zowie-ek-za-s-series-no-za13-37010434064629.jpg?v=1677191942",
    "https://cdn.shopify.com/s/files/1/0636/9044/0949/products/switch-c-pulsar-kailh-box-goi-90-37010440618229.jpg?v=1677129302",
    "https://cdn.shopify.com/s/files/1/0636/9044/0949/products/switch-c-pulsar-kailh-speed-goi-90-37010436489461.jpg?v=1677129123",
    "https://cdn.shopify.com/s/files/1/0636/9044/0949/products/switch-c-pulsar-kailh-silent-goi-90-37010432491765.jpg?v=1677129305",
  ],
  nguyencong: [
    "https://nguyencongpc.vn/media/product/28601-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5070-12gb-01.jpg",
    "https://nguyencongpc.vn/media/product/29325-pc-gaming-ryzen-7-7800x3d-ram-32gb-rtx-5080-16gb-11.jpg",
    "https://nguyencongpc.vn/media/product/27426-pc-gaming-25251340.jpg",
    "https://nguyencongpc.vn/media/product/27462-b--pc-gaming-ryzen-7-9800x3d-ram-32g-vga-rtx-5080.jpg",
    "https://nguyencongpc.vn/media/product/27563-pc-gaming-amd-ryzen-5-5500-ram-16gb-rx-7600-8gb.jpg",
    "https://nguyencongpc.vn/media/product/28132-pc-gaming-intel-core-i7-14700k-ram-64gb-rtx-4070-super-12gb-10.jpg",
  ],
};

const sourceOrder = ["playzone", "gearvn", "phongcachxanh", "nguyencong"];

async function run() {
  const result = await query("SELECT id FROM products ORDER BY id ASC");
  const ids = result.rows.map((row) => row.id);

  if (ids.length === 0) {
    console.log("Khong co san pham de cap nhat anh.");
    return;
  }

  await query("BEGIN");
  try {
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      const sourceName = sourceOrder[i % sourceOrder.length];
      const poolBySource = imagePools[sourceName];
      const imageUrl = poolBySource[i % poolBySource.length];

      await query("UPDATE products SET image_url = $1 WHERE id = $2", [imageUrl, id]);
    }

    await query("COMMIT");
    console.log(`Da cap nhat anh cho ${ids.length} san pham tu 4 nguon Playzone/GearVN/PhongCachXanh/NguyenCong.`);
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
}

run()
  .catch((error) => {
    console.error("Cap nhat anh that bai:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
