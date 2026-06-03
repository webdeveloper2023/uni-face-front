# UniFace Front

[`webdeveloper2023/uni-face`](https://github.com/webdeveloper2023/uni-face)
backendiga ulanadigan oddiy test frontend.

**Stack:** Vite + React + TypeScript + Tailwind CSS v4 + react-webcam + axios.

## Imkoniyatlar

- **Reference rasm yuklash** — diskdan rasm tanlab, backendning
  `POST /reference` endpointiga yuboradi.
- **Kameradan rasmga olish** — `react-webcam` orqali web-kamera oqimini
  ko'rsatadi, bir kadrni JPEG sifatida oladi.
- **Verify** — olingan kadrni `POST /verify` ga yuborib, natijani
  (match / similarity / confidence) ko'rsatadi.

## Ishga tushirish

```bash
npm install
cp .env.example .env       # kerak bo'lsa API URL ni o'zgartiring
npm run dev
```

Dev server: <http://127.0.0.1:5400>

> **Eslatma:** Windows'da default Vite porti **5173** ko'pincha Hyper-V / WSL
> tomonidan band qilinadi (`EACCES`). Shu sabab loyiha **5400** portida
> ishlaydi. Hozir band qilingan port range'lari:
> `netsh interface ipv4 show excludedportrange protocol=tcp`

> Backend (`uni-face`) `http://localhost:8000` da ishlab turishi kerak.
> Backendda CORS ochiq (`*`), shuning uchun frontend to'g'ridan-to'g'ri murojaat
> qila oladi.

## Backendni ishga tushirish

```bash
git clone https://github.com/webdeveloper2023/uni-face.git
cd uni-face
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Sozlamalar

| O'zgaruvchi | Default | Tavsif |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | UniFace API manzili |

## Build

```bash
npm run build
npm run preview
```
