# نصب داشبورد روی سرور — خیلی خیلی ساده

> این راهنما مثل یک نقشه‌ی گنج است. هر قدم را یکی‌یکی انجام بده.
> جا نزن. اگر گیر کردی، خروجی را بفرست.

---

## قدم ۱ — کد را ببر روی GitHub

1. توی Lovable بالا سمت راست دکمه‌ی **GitHub** را پیدا کن و بزن.
2. **Connect to GitHub** را بزن.
3. اجازه بده پروژه را روی GitHub بگذارد.
4. وقتی تمام شد، یک آدرس می‌بینی مثل:
   ```
   https://github.com/ali-xyz/covered-call.git
   ```
   این آدرس را کپی کن و یادت بماند. (توی قدم ۳ لازمش داریم.)

---

## قدم ۲ — وارد سرور شو (Termius)

1. اپ Termius را روی گوشی باز کن.
2. به سرور `87.107.5.114` وصل شو.
3. وقتی خط سیاه با `root@...#` را دیدی، یعنی وارد شدی.

---

## قدم ۳ — ابزارها را نصب کن

این خط را کپی کن و بزن:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs git
```

صبر کن تا تمام شود. اگر پرسید `Y/n` فقط `y` بزن.

---

## قدم ۴ — کد را از GitHub بردار

این دستور را بزن (آدرس خودت را بگذار):

```bash
cd /opt && git clone https://github.com/ali-xyz/covered-call.git dashboard
```

بعد:

```bash
cd dashboard
npm install
```

صبر کن — چند دقیقه طول می‌کشد.

---

## قدم ۵ — داشبورد را بساز (build)

```bash
npm run build
```

صبر کن چند دقیقه. اگر نوشت `build successful` یعنی خوب است.

اگر رم کم بود و خطا داد:
```bash
NODE_OPTIONS=--max-old-space-size=1024 npm run build
```

---

## قدم ۶ — تست کن

```bash
PORT=8080 node vps/serve.mjs
```

اگر نوشت `Dashboard running` یعنی خوب است.
با `Ctrl+C` خاموشش کن.

---

## قدم ۷ — برای همیشه روشن کن

این را کامل کپی کن و بزن:

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

اگر نوشت `active (running)` یعنی برای همیشه روشن شد. ✅

---

## قدم ۸ — باز کن

در مرورگر (از داخل ایران):
```
http://87.107.5.114
```

کادر «سرور واسط» را **خالی** بگذار. تمام! 🎊

---

## بعد از هر تغییر در Lovable

```bash
cd /opt/dashboard && git pull && npm install && npm run build && systemctl restart dashboard
```

## اگر پورت ۸۰ اشغال بود
در فایل سرویس `Environment=PORT=3000` بگذار و `http://87.107.5.114:3000` را باز کن.
