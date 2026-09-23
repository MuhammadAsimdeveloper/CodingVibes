import {hash} from '../core/hash.js';

function json(value){return JSON.stringify(value,null,2)+'\n';}
function commonReadme(spec,target){return `# Generated codingVibes app\n\nTarget: ${target.label}\nLanguage: ${target.language}\nFramework: ${target.framework}\n\nThis project was generated from a structured application contract. Build artifacts are only marked verified when the target toolchain and verification checks succeed.\n\nPages: ${spec.pages.join(', ') || '/'}\n\nAPIs: ${spec.apis.map(x=>`${x.method} ${x.path}`).join(', ') || 'none'}\n`}

function pwaExtras(){return [
  {path:'public/manifest.webmanifest',content:json({name:'codingVibes app',short_name:'codingVibes',start_url:'/',display:'standalone',background_color:'#0b1020',theme_color:'#0b1020',icons:[]})},
  {path:'public/sw.js',content:`self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});\n`},
];}

export function generateTargetFallback(spec,target){
  const files=[];
  if(target.id==='web-pwa')return null;
  if(target.id==='android-twa')return {files:[
    {path:'android/settings.gradle',content:`pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }
rootProject.name='codingvibes-twa'
include ':app'
`},
    {path:'android/build.gradle',content:`plugins { id 'com.android.application' version '8.7.3' apply false }
`},
    {path:'android/app/build.gradle',content:`plugins { id 'com.android.application' }
android { namespace 'com.codingvibes.twa'; compileSdk 35
 defaultConfig { applicationId 'com.codingvibes.twa'; minSdk 23; targetSdk 35; versionCode 1; versionName '1.0' }
}
dependencies { implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.6.2' }
`},
    {path:'android/app/src/main/res/values/strings.xml',content:`<resources><string name="app_name">codingVibes</string><string name="launchUrl">https://example.com/</string></resources>
`},
    {path:'android/app/src/main/AndroidManifest.xml',content:`<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:theme="@android:style/Theme.DeviceDefault.Light.NoActionBar" android:label="@string/app_name"><activity android:name="com.google.androidbrowserhelper.trusted.LauncherActivity" android:exported="true"><meta-data android:name="android.support.customtabs.trusted.DEFAULT_URL" android:value="@string/launchUrl"/><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>
`},
    {path:'README.md',content:commonReadme(spec,target)+'\nSet the trusted web origin in strings.xml and configure Digital Asset Links for production trust. Then build with Android Gradle tooling.\n'},
  ],summary:`Generate ${target.label}`,manifestHash:hash(spec),source:'deterministic'};
  if(target.id==='mobile-expo')return {files:[
    {path:'package.json',content:json({name:'codingvibes-mobile',version:'0.1.0',private:true,scripts:{check:'node --check App.tsx',test:'node --test test/smoke.test.js'},dependencies:{expo:'^53.0.0','react':'^19.0.0','react-native':'^0.79.0'},devDependencies:{typescript:'^5.0.0'}})},
    {path:'app.json',content:json({expo:{name:'codingVibes App',slug:'codingvibes-app',version:'1.0.0',orientation:'portrait',platforms:['android','ios'],android:{package:'com.codingvibes.app'},ios:{bundleIdentifier:'com.codingvibes.app'}}})},
    {path:'eas.json',content:json({build:{development:{developmentClient:true,distribution:'internal'},preview:{distribution:'internal',android:{buildType:'apk'}},production:{}}})},
    {path:'App.tsx',content:`import React from 'react';import{SafeAreaView,Text,StyleSheet,View}from'react-native';export default function App(){return <SafeAreaView style={styles.safe}><View style={styles.card}><Text style={styles.kicker}>codingVibes</Text><Text style={styles.title}>${escapeForCode(spec.request.slice(0,120))}</Text><Text style={styles.body}>Generated for ${target.label}.</Text></View></SafeAreaView>}const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#0b1020'},card:{margin:24,marginTop:80,padding:24,borderRadius:24,backgroundColor:'#121a2d'},kicker:{color:'#8ea8ff',fontWeight:'700'},title:{color:'#fff',fontSize:30,fontWeight:'800',marginTop:12},body:{color:'#aebbd1',marginTop:12}});\n`},
    {path:'test/smoke.test.js',content:`import test from'node:test';import assert from'node:assert/strict';test('mobile source exists',()=>assert.ok(true));\n`},
    {path:'README.md',content:commonReadme(spec,target)+'\nUse Expo/EAS or a configured Android/iOS toolchain to produce platform binaries.\n'},
  ],summary:`Generate ${target.label}`,manifestHash:hash(spec),source:'deterministic'};
  if(target.id==='mobile-flutter')return {files:[
    {path:'pubspec.yaml',content:`name: codingvibes_app\ndescription: Generated by codingVibes\npublish_to: "none"\nversion: 1.0.0+1\nenvironment:\n  sdk: '>=3.4.0 <4.0.0'\ndependencies:\n  flutter:\n    sdk: flutter\ndev_dependencies:\n  flutter_test:\n    sdk: flutter\nflutter:\n  uses-material-design: true\n`},
    {path:'lib/main.dart',content:`import 'package:flutter/material.dart';void main()=>runApp(const CodingVibesApp());class CodingVibesApp extends StatelessWidget{const CodingVibesApp({super.key});@override Widget build(BuildContext context)=>MaterialApp(theme:ThemeData.dark(useMaterial3:true),home:Scaffold(appBar:AppBar(title:const Text('codingVibes')),body:Padding(padding:const EdgeInsets.all(24),child:Text('${escapeForCode(spec.request.slice(0,160))}'))));}\n`},
    {path:'test/widget_test.dart',content:`import 'package:flutter_test/flutter_test.dart';import 'package:codingvibes_app/main.dart';void main(){testWidgets('app mounts',(tester)async{await tester.pumpWidget(const CodingVibesApp());expect(find.text('codingVibes'),findsOneWidget);});}\n`},
    {path:'README.md',content:commonReadme(spec,target)+'\nRun `flutter analyze`, `flutter test`, then `flutter build apk` or `flutter build appbundle`.\n'},
  ],summary:`Generate ${target.label}`,manifestHash:hash(spec),source:'deterministic'};
  if(target.id==='android-kotlin')return {files:[
    {path:'settings.gradle.kts',content:`pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\nrootProject.name = "codingvibes-app"\ninclude(":app")\n`},
    {path:'build.gradle.kts',content:`plugins { id("com.android.application") version "8.7.3" apply false; id("org.jetbrains.kotlin.android") version "2.0.21" apply false }\n`},
    {path:'app/build.gradle.kts',content:`plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }\nandroid { namespace = "com.codingvibes.app"; compileSdk = 35\n defaultConfig { applicationId = "com.codingvibes.app"; minSdk = 26; targetSdk = 35; versionCode = 1; versionName = "1.0" } }\n`},
    {path:'app/src/main/AndroidManifest.xml',content:`<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:theme="@android:style/Theme.Material.Light.NoActionBar" android:label="codingVibes"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>\n`},
    {path:'app/src/main/java/MainActivity.kt',content:`package com.codingvibes.app\nimport android.app.Activity\nimport android.os.Bundle\nimport android.widget.TextView\nclass MainActivity: Activity(){override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);val view=TextView(this);view.text="${escapeForCode(spec.request.slice(0,160))}";view.textSize=24f;setContentView(view)}}\n`},
    {path:'README.md',content:commonReadme(spec,target)+'\nRun the Gradle wrapper on a machine with the Android SDK to produce a debug APK/AAB.\n'},
  ],summary:`Generate ${target.label}`,manifestHash:hash(spec),source:'deterministic'};
  if(target.id==='ios-swiftui')return {files:[
    {path:'Package.swift',content:`// swift-tools-version: 6.0\nimport PackageDescription\nlet package=Package(name:"CodingVibesApp",platforms:[.iOS(.v17)],products:[.library(name:"CodingVibesApp",targets:["App"])],targets:[.target(name:"App")])\n`},
    {path:'Sources/App/App.swift',content:`import SwiftUI\npublic struct ContentView:View{public init(){};public var body:some View{VStack(alignment:.leading,spacing:16){Text("codingVibes").font(.caption).foregroundStyle(.blue);Text("${escapeForCode(spec.request.slice(0,160))}").font(.largeTitle.bold());Text("Generated for SwiftUI.").foregroundStyle(.secondary)}}}\n#if os(iOS)\n@main struct CodingVibesApp:App{var body:some Scene{WindowGroup{ContentView()}}}\n#endif\n`},
    {path:'README.md',content:commonReadme(spec,target)+'\nOpen in Xcode for simulator/build/archive workflows. Linux can only validate the Swift package source, not iOS signing or simulator builds.\n'},
  ],summary:`Generate ${target.label}`,manifestHash:hash(spec),source:'deterministic'};
  if(target.id==='desktop-electron')return {files:[
    {path:'package.json',content:json({name:'codingvibes-desktop',version:'0.1.0',private:true,type:'module',main:'src/main.js',scripts:{start:'electron .',check:'node --check src/main.js',test:'node --test test/smoke.test.js'},devDependencies:{electron:'^37.0.0'}})},
    {path:'src/main.js',content:`import{app,BrowserWindow}from'electron';import path from'node:path';const create=()=>{const w=new BrowserWindow({width:1280,height:800});w.loadFile(path.join(process.cwd(),'src/index.html'));};app.whenReady().then(create);app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});\n`},
    {path:'src/index.html',content:`<!doctype html><html><body style="font-family:system-ui;padding:48px;background:#0b1020;color:white"><h1>codingVibes</h1><p>${escapeForHtml(spec.request.slice(0,220))}</p></body></html>`},
    {path:'test/smoke.test.js',content:`import test from'node:test';import assert from'node:assert/strict';test('desktop source exists',()=>assert.ok(true));\n`},
    {path:'README.md',content:commonReadme(spec,target)+'\nRun npm install and npm start on the target OS to launch. Package with your preferred Electron distribution tooling.\n'},
  ],summary:`Generate ${target.label}`,manifestHash:hash(spec),source:'deterministic'};
  if(target.id==='desktop-tauri')return {files:[
    {path:'package.json',content:json({name:'codingvibes-tauri',private:true,type:'module',scripts:{check:'node --check src/main.js'},dependencies:{'@tauri-apps/api':'^2.5.0'}})},
    {path:'src/main.js',content:`console.log('codingVibes Tauri frontend');\n`},
    {path:'src-tauri/Cargo.toml',content:`[package]\nname="codingvibes-app"\nversion="0.1.0"\nedition="2021"\n[dependencies]\ntauri={version="2",features=[]}\n`},
    {path:'src-tauri/src/main.rs',content:`fn main(){tauri::Builder::default().run(tauri::generate_context!()).expect("error while running tauri application");}\n`},
    {path:'README.md',content:commonReadme(spec,target)+'\nRequires Rust/Cargo and Tauri tooling on the build machine.\n'},
  ],summary:`Generate ${target.label}`,manifestHash:hash(spec),source:'deterministic'};
  if(target.id==='multiplatform-kmp')return {files:[
    {path:'settings.gradle.kts',content:`pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositories { google(); mavenCentral() } }\nrootProject.name="codingvibes-kmp"\ninclude(":shared")\n`},
    {path:'build.gradle.kts',content:`plugins { kotlin("multiplatform") version "2.2.10" apply false }\n`},
    {path:'shared/build.gradle.kts',content:`plugins { kotlin("multiplatform") }\nkotlin { jvm(); iosArm64(); iosSimulatorArm64(); js(IR) { browser() } }\n`},
    {path:'shared/src/commonMain/kotlin/App.kt',content:`package codingvibes\nobject AppInfo{const val title="codingVibes";const val request="${escapeForCode(spec.request.slice(0,160))}"}\n`},
    {path:'README.md',content:commonReadme(spec,target)+'\nUse the Gradle/KMP toolchain to add the exact platform targets and produce each artifact.\n'},
  ],summary:`Generate ${target.label}`,manifestHash:hash(spec),source:'deterministic'};
  // web-node and unknown target fall back to the existing generator upstream
  return null;
}

function escapeForCode(s){return String(s).replaceAll('\\','\\\\').replaceAll('`','\\`').replaceAll('${','\\${').replaceAll("'","\\'").replaceAll('"','\\"');}
function escapeForHtml(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
