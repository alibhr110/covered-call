# راه‌اندازی واسط TSETMC روی VPS ایران

روی سرور (مثلاً 87.107.5.114):

```bash
# نصب Node در صورت نبود
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs

mkdir -p /opt/tsetmc && cd /opt/tsetmc
# فایل tsetmc-proxy.mjs را اینجا کپی کنید
node tsetmc-proxy.mjs        # تست سریع

# اجرای دائمی
sudo tee /etc/systemd/system/tsetmc.service >/dev/null <<'EOF'
[Unit]
Description=TSETMC proxy
After=network.target
[Service]
ExecStart=/usr/bin/node /opt/tsetmc/tsetmc-proxy.mjs
Environment=PORT=8787
Restart=always
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now tsetmc
sudo ufw allow 8787/tcp
```

تست: `curl http://87.107.5.114:8787/tsetmc | head -c 200`

سپس در داشبورد، در باکس «آدرس سرور واسط (VPS)» مقدار زیر را وارد کنید:

```
http://87.107.5.114:8787
```

نکته: چون داشبورد روی HTTPS اجرا می‌شود، مرورگر ممکن است درخواست HTTP را بلاک کند؛
در این حالت داده از سمت سرور Lovable از VPS شما گرفته می‌شود (کار می‌کند)، یا برای
دریافت مستقیم مرورگری، روی VPS یک دامنه با SSL (Caddy/Nginx + Let's Encrypt) قرار دهید.
