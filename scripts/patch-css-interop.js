// react-native-css-interop@0.2.4가 구형 Metro eventsQueue 형식을 사용해
// Expo 56(Metro 최신)에서 hot reload 시 크래시 발생.
// { changes: { addedFiles, modifiedFiles, removedFiles }, rootDir } 형식으로 패치.
// (pet-herbs-lab / dog-snack-app에서 검증된 동일 패치)
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '../node_modules/react-native-css-interop/dist/metro/index.js'
);

if (!fs.existsSync(target)) {
  console.warn('⚠️  react-native-css-interop Metro 파일을 찾지 못함 — 패치 건너뜀');
  process.exit(0);
}

let src = fs.readFileSync(target, 'utf8');

const OLD = `haste.emit("change", {
                eventsQueue: [
                    {
                        filePath,
                        metadata: {
                            modifiedTime: Date.now(),
                            size: 1,
                            type: "virtual",
                        },
                        type: "change",
                    },
                ],
            });`;

const NEW = `haste.emit("change", {
                changes: {
                    addedFiles: [],
                    modifiedFiles: [[filePath, { modifiedTime: Date.now(), size: 1, type: "virtual" }]],
                    removedFiles: [],
                },
                rootDir: "",
            });`;

// 0.2.5+는 신형 changes/rootDir 형식을 상류에서 이미 포함(legacy eventsQueue와 공존,
// Metro는 신형을 읽음) → 패치 불필요.
const ALREADY_FIXED =
  src.includes('get rootDir()') &&
  (src.includes('changedFiles: new Set') || src.includes('changes:'));

if (src.includes(OLD)) {
  fs.writeFileSync(target, src.replace(OLD, NEW), 'utf8');
  console.log('✅ react-native-css-interop Metro patch applied');
} else if (src.includes(NEW) || ALREADY_FIXED) {
  console.log('✅ react-native-css-interop Metro hot-reload 호환 — 패치 불필요(상류 반영됨)');
} else {
  console.warn('⚠️  react-native-css-interop patch target not found — check version');
}
