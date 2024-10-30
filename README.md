# EtherDrops Miniapp

### Fitur
- Auto complete task
- Daily check in
- Auto Predik
- Multi Akun
- Daily Task
- Send Notif Ke Telegram


### Step

**1. clone repo dan masuk ke folder**
```
git clone https://github.com/yogik23/skw-etherdrop && cd skw-etherdrop
```

**2. Install Module**
```
npm install
```

**3. submit query di file** `data.txt`
```
nano data.txt
```
format query 
```
query_id=AAE1 
query_id=AAE2 
query_id=AAE3
```
**4. Submit API Token & UserID Telegram di file** `.env`
```
nano .env
```
format .env
```
TELEGRAM_BOT_TOKEN=APITOKENBOT
TELEGRAM_CHAT_ID=UserIDtelegram
```
contoh format .env
```
TELEGRAM_BOT_TOKEN=1234677824:AAEasddCuj-iBp0sJUkNAtpH3VuY4tSqWHFI
TELEGRAM_CHAT_ID=123456789
```
**5. Jalankan bot**
```
node main.js
```

**Sodah kerjekan mun sian botnye**
