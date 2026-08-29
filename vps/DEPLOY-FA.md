# اجرای کل داشبورد روی VPS ایران (راهنمای ساده)

وقتی خودِ داشبورد داخل ایران اجرا شود، دیگر نیازی به پروکسی، تانل یا باز کردن پورت برای دنیای بیرون نیست؛
هم صفحه و هم داده از یک آدرس (سرور خودت) می‌آید.

## قدم ۰ — کد را روی GitHub بگذارید
در Lovable بالا سمت راست: **GitHub → Connect to GitHub** و پروژه را Push کنید.
آدرس مخزن را بردارید، مثلاً `https://github.com/USER/REPO.git`.

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
npm run build
```
(چند دقیقه طول می‌کشد. اگر رم سرور کم بود: `NODE_OPTIONS=--max-old-space-size=1024 npm run build`)

## قدم ۳ — تست اجرا
```bash
cd /opt/dashboard
PORT=8080 node vps/serve.mjs
```
اگر نوشت `Dashboard running...` یعنی درست است. با `Ctrl+C` ببندید و برو قدم بعد.

## قدم ۴ — اجرای دائمی روی پورت ۸۰
```bash
cat > /etc/systemd/system/dashboard.service << 'EOF'
[Unit]
Description=Covered Call Dashboard
After=network.target

[Service]
WorkingDirectory=/opt/dashboard
Environment=PORT=80
Environment=HOST=0.0.0.0
ExecStart=/usr/bin/node /opt/dashboard/vps/serve.mjs
Restart=always

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable --now dashboard
systemctl status dashboard --no-pager
```

## قدم ۵ — باز کردن داشبورد
در مرورگر گوشی یا لپ‌تاپ (داخل ایران):
```
http://87.107.5.114
```
کادر «سرور واسط» را **خالی** بگذارید؛ داده مستقیم از همان سرور گرفته می‌شود
(آدرس داخلی: `/api/public/tsetmc`).

## به‌روزرسانی بعد از هر تغییر در Lovable
```bash
cd /opt/dashboard && git pull && npm install && npm run build && systemctl restart dashboard
```

## نکته‌ها
- اگر پورت ۸۰ اشغال بود: در سرویس `Environment=PORT=3000` بگذارید و `http://87.107.5.114:3000` را باز کنید.
- سرویس قدیمی پروکسی دیگر لازم نیست: `systemctl disable --now tsetmc`
- دیدن خطاها: `journalctl -u dashboard -n 50 --no-pager`
