# Nature.co Chat Application

Modern, responsive chat uygulaması. Firebase Realtime Database ve Push Notifications desteği ile.

## 🌟 Özellikler

- ✅ Gerçek zamanlı mesajlaşma
- ✅ Multi-server desteği (Biyom & Ekosistem Chat)
- ✅ Push notifications (FCM)
- ✅ Admin paneli
- ✅ Kanal ve DM desteği
- ✅ Arkadaş sistemi
- ✅ Forum
- ✅ Glassmorphism UI

## 🚀 Kurulum

### 1. Repository'yi Klonlayın
```bash
git clone <your-repo-url>
cd nature-chat
```

### 2. Frontend Bağımlılıklarını Yükleyin
```bash
cd frontend
yarn install
```

### 3. Environment Variables Ayarlayın
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
- `REACT_APP_VAPID_KEY_LAYLA`: Firebase Console'dan alın
- `REACT_APP_VAPID_KEY_BIYOM`: Firebase Console'dan alın

### 4. Uygulamayı Başlatın
```bash
yarn start
```

## 🔥 Firebase Yapılandırması

### Mevcut Firebase Projeleri

**1. Biyom (sohbet-cfe7f)**
- Database: `https://sohbet-cfe7f-default-rtdb.europe-west1.firebasedatabase.app`
- Tüm mesajlar, kanallar ve kullanıcılar burada saklanıyor

**2. Ekosistem Chat (Layla - layla-70d21)**
- Database: `https://layla-70d21-default-rtdb.europe-west1.firebasedatabase.app`
- Tüm mesajlar, kanallar ve kullanıcılar burada saklanıyor

### Firebase Config Dosyası
Config ayarları: `/frontend/src/config/firebase.js`

⚠️ **ÖNEMLİ**: Firebase config'leri zaten kodda mevcut. Ekstra bir şey yapmanıza gerek yok!

## 📱 Push Notifications

### VAPID Keys Alma
1. Firebase Console'a gidin: https://console.firebase.google.com
2. Projenizi seçin (Biyom veya Ekosistem Chat)
3. Project Settings ⚙️ → Cloud Messaging
4. Web Push certificates → "Generate key pair"
5. VAPID key'i kopyalayın
6. `.env` dosyasına ekleyin

## 🗄️ Veri Yapısı

Tüm veriler Firebase Realtime Database'de saklanıyor:

```
/users/{username}
  - isAdmin: boolean
  - passwordHash: string
  - color: string
  - ...

/rooms/{roomId}
  - name: string
  - type: "channel" | "dm"
  - description: string
  - ...

/msgs/{roomId}/{msgId}
  - user: string
  - text: string
  - ts: timestamp
  - ...

/fcmTokens/{userId}
  - token: string
  - platform: "web"
  - updatedAt: timestamp
```

## 🔐 Güvenlik

- `.env` dosyası `.gitignore`'da - GitHub'a yüklenmez
- API keys public olabilir (Firebase Security Rules ile korunur)
- Password'ler SHA-256 ile hash'lenir

## 🌍 Deploy

### Vercel/Netlify
```bash
# Build
yarn build

# Deploy (otomatik)
# .env değişkenlerini deploy platform'unda ayarlayın
```

### Environment Variables (Production)
```
REACT_APP_BACKEND_URL=https://your-domain.com
REACT_APP_VAPID_KEY_LAYLA=<your-key>
REACT_APP_VAPID_KEY_BIYOM=<your-key>
```

## ❓ SSS

### S: GitHub'a yüklediğimde mesajlarım kaybolur mu?
**C:** HAYIR! Mesajlar Firebase cloud'da saklanıyor. GitHub'da sadece kod var. Aynı Firebase config kullandığınız sürece tüm verileriniz erişilebilir kalır.

### S: Başka bir yerde deploy edersem veriler gelir mi?
**C:** EVET! Firebase config aynı kaldığı sürece, nerede deploy ederseniz edin tüm verileriniz erişilebilir olur.

### S: Firebase config'leri değiştirmem gerekir mi?
**C:** HAYIR! Config'ler zaten `firebase.js` dosyasında mevcut. Sadece `.env` dosyasına VAPID key'leri eklemeniz yeterli.

## 🛠️ Teknolojiler

- React 18
- Firebase 12.10.0 (Realtime Database, Authentication, Cloud Messaging)
- Lucide React (Icons)
- Crypto-js (Password hashing)

## 📝 Lisans

Bu proje özel kullanım içindir.
