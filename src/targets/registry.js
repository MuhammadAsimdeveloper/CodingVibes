const TARGETS = [
  {
    id: 'web-node', family: 'web', label: 'Web app · Node', language: 'javascript', framework: 'node-http', packageManager: 'npm',
    runtime: 'node', artifactTypes: ['source', 'web-preview'], preview: 'node-server', requiredFiles: ['package.json','app/server.js','public/index.html','public/app.js','public/styles.css','test/acceptance.test.js'],
    verify: ['npm run check','npm test'], supports: ['web','backend','api','seo','3d','animation','auth','database'], native: false,
  },
  {
    id: 'web-pwa', family: 'web', label: 'Installable Web · PWA', language: 'javascript', framework: 'web-pwa', packageManager: 'npm', runtime: 'node', artifactTypes: ['source','web-preview','pwa'], preview: 'node-server',
    requiredFiles: ['package.json','app/server.js','public/index.html','public/app.js','public/styles.css','public/manifest.webmanifest','public/sw.js'], verify: ['npm run check','npm test'], supports: ['web','offline','installable','push','3d','animation'], native: false,
  },
  {
    id: 'android-twa', family: 'android', label: 'Android · Web APK (TWA)', language: 'kotlin', framework: 'trusted-web-activity', packageManager: 'gradle', runtime: 'android', artifactTypes: ['source','apk','aab'], preview: 'web-dependency',
    requiredFiles: ['android/settings.gradle','android/app/build.gradle','android/app/src/main/AndroidManifest.xml','android/app/src/main/res/values/strings.xml'], verify: ['gradle wrapper validation','gradle assembleDebug'], supports: ['android','pwa','apk','aab'], native: true,
  },
  {
    id: 'mobile-expo', family: 'mobile', label: 'Mobile · Expo / React Native', language: 'typescript', framework: 'expo-react-native', packageManager: 'npm', runtime: 'node', artifactTypes: ['source','android-apk','android-aab','ios-source'], preview: 'expo-web-or-device',
    requiredFiles: ['package.json','app.json','App.tsx'], verify: ['npm run check','npm test','expo export'], supports: ['android','ios','apk','mobile','camera','location','notifications'], native: true,
  },
  {
    id: 'mobile-flutter', family: 'mobile', label: 'Mobile · Flutter / Dart', language: 'dart', framework: 'flutter', packageManager: 'pub', runtime: 'flutter', artifactTypes: ['source','android-apk','android-aab','ios-source'], preview: 'flutter-web',
    requiredFiles: ['pubspec.yaml','lib/main.dart','test/widget_test.dart'], verify: ['flutter analyze','flutter test'], supports: ['android','ios','apk','mobile','animations','desktop','web'], native: true,
  },
  {
    id: 'android-kotlin', family: 'android', label: 'Android · Native Kotlin', language: 'kotlin', framework: 'android-sdk', packageManager: 'gradle', runtime: 'android', artifactTypes: ['source','apk','aab'], preview: 'android-emulator',
    requiredFiles: ['settings.gradle.kts','app/build.gradle.kts','app/src/main/AndroidManifest.xml','app/src/main/java/MainActivity.kt'], verify: ['gradle assembleDebug','gradle test'], supports: ['android','apk','aab','native'], native: true,
  },
  {
    id: 'ios-swiftui', family: 'ios', label: 'Apple · SwiftUI', language: 'swift', framework: 'swiftui', packageManager: 'swiftpm/xcode', runtime: 'xcode', artifactTypes: ['source','ipa'], preview: 'xcode-simulator',
    requiredFiles: ['Package.swift','Sources/App/App.swift'], verify: ['swift build','xcodebuild test'], supports: ['ios','macos','ipados','swiftui','native'], native: true,
  },
  {
    id: 'desktop-electron', family: 'desktop', label: 'Desktop · Electron', language: 'javascript', framework: 'electron', packageManager: 'npm', runtime: 'node', artifactTypes: ['source','desktop-installer'], preview: 'electron',
    requiredFiles: ['package.json','src/main.js','src/index.html'], verify: ['npm run check','npm test'], supports: ['windows','macos','linux','desktop'], native: false,
  },
  {
    id: 'desktop-tauri', family: 'desktop', label: 'Desktop · Tauri / Rust', language: 'rust', framework: 'tauri', packageManager: 'cargo/npm', runtime: 'rust-node', artifactTypes: ['source','desktop-installer'], preview: 'tauri',
    requiredFiles: ['package.json','src-tauri/Cargo.toml','src-tauri/src/main.rs'], verify: ['cargo check','npm run check'], supports: ['windows','macos','linux','desktop','rust'], native: true,
  },
  {
    id: 'multiplatform-kmp', family: 'multiplatform', label: 'Multiplatform · Kotlin', language: 'kotlin', framework: 'kotlin-multiplatform', packageManager: 'gradle', runtime: 'gradle', artifactTypes: ['source','android','ios','desktop','web'], preview: 'compose',
    requiredFiles: ['settings.gradle.kts','build.gradle.kts','shared/src/commonMain/kotlin/App.kt'], verify: ['gradle test'], supports: ['android','ios','desktop','web','server'], native: true,
  },
];

export function listTargets(){return TARGETS.map(({id,family,label,language,framework,packageManager,runtime,artifactTypes,native})=>({id,family,label,language,framework,packageManager,runtime,artifactTypes,native}));}
export function getTarget(id){return TARGETS.find(t=>t.id===id)||null;}

function has(text, patterns){return patterns.some(x=>text.includes(x));}
export function inferTarget(request, explicit='auto'){
  const text=String(request||'').toLowerCase();
  if(explicit&&explicit!=='auto'&&getTarget(explicit))return getTarget(explicit);
  if(has(text,['swiftui','swift app','iphone app','ios app','ipad app','visionos','watchos']))return getTarget('ios-swiftui');
  if(has(text,['flutter','dart app']))return getTarget('mobile-flutter');
  if(has(text,['kotlin multiplatform','kmp','compose multiplatform']))return getTarget('multiplatform-kmp');
  if(has(text,['native kotlin','android kotlin','jetpack compose','android studio','android app']))return getTarget('android-kotlin');
  if(has(text,['apk from website','web apk','trusted web activity','twa']))return getTarget('android-twa');
  if(has(text,['expo','react native','react-native','mobile app','android and ios','cross platform mobile']))return getTarget('mobile-expo');
  if(has(text,['tauri','rust desktop']))return getTarget('desktop-tauri');
  if(has(text,['electron','desktop app','windows app','mac app','linux app']))return getTarget('desktop-electron');
  if(has(text,['pwa','progressive web app','installable website','offline web app']))return getTarget('web-pwa');
  return getTarget('web-node');
}

export function targetRequirements(target){
  if(!target)return [];
  return target.requiredFiles;
}

export function targetSummary(target){
  return target ? `${target.label} · ${target.language} · ${target.framework}` : 'unknown target';
}
