# TKD Frontend

Monorepo npm workspaces cho các ứng dụng frontend của Taekwondo Văn Quán.

```text
tkd-frontend/
├── apps/
│   ├── mobile/                 # Expo SDK 58 / React Native app
│       ├── android/
│       ├── ios/
│       ├── assets/
│       ├── src/
│       ├── app.config.ts
│       ├── package.json
│       └── tsconfig.json
│   └── web/                    # Vite / React UI
├── packages/
│   ├── api-client/             # Axios runtime, retry và refresh-token seam
│   ├── contracts/              # DTO, upload và pagination contracts
│   ├── domain/                 # Business concepts không phụ thuộc UI
│   ├── query/                  # TanStack Query cache policy
│   └── utils/                  # Pure utilities
├── docs/
├── package.json                # Workspace orchestration
└── README.md
```

## Cài đặt

Từ root monorepo:

```bash
npm install
```

## Chạy mobile

Từ root:

```bash
npm run mobile
npm run mobile:android
npm run mobile:ios
npm run mobile:web
npm run web
npm run web:build
```

Hoặc chạy trực tiếp trong Expo project:

```bash
cd apps/mobile
npx expo start
```

Các kiểm tra chất lượng từ root:

```bash
npm run mobile:typecheck
npm run mobile:test
npm run mobile:lint
```

## Shared packages

Chỉ tách code vào `packages/` khi mobile và web thực sự cùng dùng một hợp đồng
hoặc implementation. Xem [packages/README.md](packages/README.md).
