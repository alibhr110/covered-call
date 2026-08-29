# اجرای کل داشبورد روی VPS ایران (راهنمای ساده)

وقتی خودِ داشبورد داخل ایران اجرا شود، دیگر نیازی به پروکسی، تانل یا باز کردن پورت برای دنیای بیرون نیست؛
هم صفحه و هم داده از یک آدرس می‌آید.

## قدم ۰ — کد را روی GitHub بگذارید
در Lovable از بالا سمت راست: **GitHub → Connect to GitHub** و پروژه را Push کنید.
آدرس مخزن (مثلاً `https://github.com/USER/REPO.git`) را بردارید.

## قدم ۱ — در Termius وصل شوید و Node را نصب کنید
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs git
```

## قدم ۲ — گرفتن کد و ساخت (build)
```bash
cd /opt
git clone https://github.com/USER/REPO.git dashboard
cd dashboard
npm install
SERVER_PRESET=node-server npm run build
```
(ساخت چند دقیقه طول می‌کشد.)

## قدم ۳ — اجرای دائمی روی پورت ۸۰
```bash
cat > /etc/systemd/system/dashboard.service << 'EOF'
[Unit]
Description=Covered Call Dashboard
After=network.target

[Service]
WorkingDirectory=/opt/dashboard
Environment=PORT=80
Environment=HOST=0.0.0.0
ExecStart=/usr/bin/node /opt/dashboard/.output/server/index.mjs
Restart=always

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable --now dashboard
systemctl status dashboard --no-pager
```

## قدم ۴ — باز کردن داشبورد
در مرورگر گوشی یا لپ‌تاپ (داخل ایران):
```
http://87.107.5.114
```
در نوار «سرور واسط» چیزی وارد نکنید؛ خالی بگذارید. داده مستقیم از خود سرور گرفته می‌شود.

## به‌روزرسانی بعد از تغییر در Lovable
```bash
cd /opt/dashboard && git pull && npm install && SERVER_PRESET=node-server npm run build && systemctl restart dashboard
```

## نکته‌ها
- اگر پورت ۸۰ اشغال بود، در سرویس `Environment=PORT=3000` بگذارید و آدرس `http://87.107.5.114:3000` را باز کنید.
- سرویس قدیمی پروکسی دیگر لازم نیست: `systemctl disable --now tsetmc`
- لاگ خطا: `journalctl -u dashboard -n 50 --no-pager`
