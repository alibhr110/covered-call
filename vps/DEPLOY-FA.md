# راهنمای نصب داشبورد روی سرور (به زبان ساده)

تصور کن سرورت مثل یک خانه‌ی اجاره‌ای توی ایران است.
داشبورد ما مثل یک اپلیکیشن است که باید توی آن خانه نصبش کنیم.
وقتی نصب شد، هم خودِ صفحه و هم داده‌های بورس از همان خانه می‌آیند —
دیگر نه پروکسی لازم است، نه تانل، نه باز کردن پورت.

---

## قدم ۱ — کد را ببر روی GitHub

فکر کن کد داشبورد مثل یک کتاب است. GitHub مثل یک کتابخانه است که کتاب را آنجا می‌گذاری تا از سرور برداری.

۱. توی Lovable بالا سمت راست دکمه‌ی **GitHub** را بزن.
۲. **Connect to GitHub** را انتخاب کن.
۳. اجازه بده پروژه را روی GitHub بگذارد.
۴. آدرس کتابخانه را کپی کن — چیزی مثل:
   ```
   https://github.com/USER/REPO.git
   ```

---

## قدم ۲ — وارد سرور شو (Termius)

فکر کن سرور یک خانه است و Termius کلید آن خانه است.

۱. اپ Termius را روی گوشی باز کن.
۲. به سرور `87.107.5.114` وصل شو (با یوزر و پسوردی که داری).
۳. وقتی وصل شدی، مثل اینکه وارد خانه شدی.

---

## قدم ۳ — ابزارهای لازم را نصب کن

سرور مثل یک خانه‌ی خالی است؛ اول باید «برق و آب» (یعنی Node و Git) راه بیندازی.

این یک خط را کپی کن و بزن:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs git
```

صبر کن تا تمام شود. اگر چیزی پرسید `y` بزن.

---

## قدم ۴ — کد را از GitHub بردار و بساز

حالا کد داشبورد را از کتابخانه (GitHub) می‌آوریم و آماده‌اش می‌کنیم.

این دستورها را یکی‌یکی بزن:

```bash
cd /opt
git clone https://github.com/USER/REPO.git dashboard
```
(به‌جای `USER/REPO` همان آدرس خودت را بگذار.)

```bash
cd dashboard
npm install
```
(این چند دقیقه طول می‌کشد — مثل اینکه وسایل خانه را می‌چینی.)

```bash
npm run build
```
(این هم چند دقیقه طول می‌کشد — مثل ساختنِ خانه. صبر کن تا تمام شود.)

اگر رم سرور کم بود و خطا داد، این را بزن:
```bash
NODE_OPTIONS=--max-old-space-size=1024 npm run build
```

---

## قدم ۵ — ببین کار می‌کند یا نه

قبل از نصب دائمی، ببینم روشن می‌شود:

```bash
cd /opt/dashboard
PORT=8080 node vps/serve.mjs
```

اگر نوشت `Dashboard running...` یعنی خوب است. 🎉
حالا با `Ctrl+C` (دو دکمه را هم‌زمان بزن) آن را خاموش کن و برو قدم بعد.

---

## قدم ۶ — برای همیشه روشن بگذار

می‌خواهیم داشبورد همیشه روشن بماند، حتی اگر گوشی را ببندی.
این دستور را کامل کپی کن و بزن (یک‌دفعه):

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

اگر نوشت `active (running)` یعنی داشبورد برای همیشه روشن شد. ✅

---

## قدم ۷ — داشبورد را باز کن

توی مرورگر گوشی یا لپ‌تاپ (از داخل ایران) این آدرس را بزن:

```
http://87.107.5.114
```

کادر «سرور واسط» را **خالی** بگذار. داده‌ی بورس خودش از همان سرور می‌آید. 🎊

---

## بعد از هر تغییر در Lovable

اگر توی Lovable چیزی را عوض کردی و خواستی روی سرور هم بیفتد، این دستور را بزن:

```bash
cd /opt/dashboard && git pull && npm install && npm run build && systemctl restart dashboard
```

یعنی: کد جدید را بگیر → وسایل را بچین → خانه را بساز → دوباره روشن کن.

---

## اگر مشکل خورد

- **اگر پورت ۸۰ اشغال بود:** در فایل سرویس `Environment=PORT=3000` بگذار و آدرس `http://87.107.5.114:3000` را باز کن.
- **سرویس قدیمی پروکسی لازم نیست:** `systemctl disable --now tsetmc`
- **دیدن خطاها:** `journalctl -u dashboard -n 50 --no-pager`
