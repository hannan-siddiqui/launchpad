<div align="center">

# 🚀 macOS Launchpad for Windows

### *An authentic Apple macOS-style Fullscreen Frosted Glass Launchpad for Windows 10 & 11*

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/hannan-siddiqui/launchpad)
[![Built with Electron](https://img.shields.io/badge/Built%20With-Electron%2040-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br/>

<p align="center">
  <b>Brings the fluid, distraction-free macOS Apple Launchpad experience to Windows.</b><br/>
  Featuring instant global shortcuts, high-res icon extraction, 110+ custom icon presets, live app search, sequential numbered hotkeys, customizable tabs, drag-and-drop reordering, and a built-in wallpaper engine.
</p>

---

</div>

## ✨ Key Features at a Glance

| Feature | Description |
| :--- | :--- |
| 🪟 **True Fullscreen Frosted Glass** | Immersive multi-layer backdrop blur (`backdrop-filter: blur(40px)`) with authentic Apple squircle iconography and zero-border card layouts. |
| ⚡ **Universal Global Shortcuts** | Instant popup on <kbd>Win</kbd> + <kbd>Space</kbd>, <kbd>Ctrl</kbd> + <kbd>Space</kbd>, <kbd>Alt</kbd> + <kbd>Space</kbd>, <kbd>F4</kbd>, <kbd>Alt</kbd> + <kbd>Z</kbd>, or any custom shortcut with fast background interception. |
| 🔢 **Sequential Hotkey Badges** | Top apps get instant single-key launch numbers: press <kbd>1</kbd> through <kbd>9</kbd> and <kbd>0</kbd> to launch immediately without using the mouse. |
| 🔎 **Installed Software Scanner** | Automatically finds all installed applications across Start Menu, Desktop, and `%LOCALAPPDATA%` with 1-click addition (no browsing file paths). |
| 📁 **Native Custom Folder Icons** | Deep Windows Shell (`SHGetFileInfo`) integration automatically retrieves custom folder icons from `desktop.ini`, DLL resource icons (e.g. `SHELL32.dll`), and `.ico` files. |
| 🎨 **110+ Categorized Icon Presets** | Expansive icon palette with over 110+ presets rendered in full 52px scale covering folders, code, cloud, documents, media, gaming, and lifestyle. |
| 🔀 **Drag-and-Drop Reordering** | Fluid HTML5 drag & drop system with live animated grid reordering and persistent order saving. |
| 📑 **Dynamic Categorized Tabs** | Organize your workspace into custom tabs (e.g., `Home`, `Work`, `Dev`, `Tools`, `Design`) with custom tab management. |
| 🌈 **Wallpaper & Theme Engine** | 12+ built-in Apple-inspired gradient themes, custom solid color picker, gradient generator, and real-time background opacity controls. |
| 📦 **1-Click NSIS Installer** | Complete desktop distribution package with an NSIS installer and silent background startup scripts. |

---

## ⌨️ Interactive Keyboard Shortcuts

<div align="center">

| Shortcut | Action | Scope |
| :---: | :--- | :---: |
| <kbd>Win</kbd> + <kbd>Space</kbd> / <kbd>Ctrl</kbd> + <kbd>Space</kbd> | Toggle Launchpad visibility | Global (Everywhere) |
| <kbd>1</kbd> - <kbd>9</kbd>, <kbd>0</kbd> | Launch app at corresponding numbered position | Inside Launchpad |
| <kbd>A</kbd> - <kbd>Z</kbd> | Type to search applications instantly | Inside Launchpad |
| <kbd>Enter</kbd> | Launch the first matching search result | Inside Launchpad |
| <kbd>Esc</kbd> | Instantly close Launchpad | Inside Launchpad |

</div>

---

## 📸 Screenshots & Highlights

<details open>
<summary><b>🌟 1. Apple macOS Launchpad Aesthetic</b></summary>
<br/>
Features authentic Apple macOS squircles with smooth hover elevation, drop shadows, and clean typography. No cluttered window borders, taskbars, or distracting desktop elements.
</details>

<details>
<summary><b>🔍 2. 1-Click Installed Applications Scanner</b></summary>
<br/>
Open Settings &rarr; **Add App / Folder** &rarr; **Search Installed PC Apps**. Launchpad automatically scans your system and displays all installed software with live search and 1-click **+ Add** buttons.
</details>

<details>
<summary><b>📁 3. Custom Folder & Native Shell Icon Extraction</b></summary>
<br/>
Customized folders (e.g., folders with custom icons assigned in Windows Explorer via Properties &rarr; Customize or `desktop.ini`) are automatically read through native Windows Shell API and rendered with crisp high resolution. Uncustomized folders fall back to an elegant macOS blue folder icon or your choice of emoji.
</details>

<details>
<summary><b>🎨 4. 110+ Custom Icon & Emoji Presets</b></summary>
<br/>
Choose from over 110+ carefully selected presets covering:
- **Folders & Storage**: 📁 📂 🗂️ 🗃️ 🗄️ 📦 🗳️ 🧰 🧳
- **Coding, Tech & Devices**: 💻 🖥️ ⌨️ 🖱️ 📱 📟 🖨️ 💾 💿 📀 🔌 🔋 ⚡ 🤖 🧠 👨‍💻 👩‍💻 ⚙️ 🛠️ 🔧 🔨 ⛏️ 🔩 🪛 🔬 🧬 🧪
- **Cloud, Web & Navigation**: 🌐 🌍 ☁️ ⛅ 🚀 🛸 📡 🛰️ 🔗 📶
- **Documents & Productivity**: 📋 📝 📄 📑 📜 📊 📈 📉 📚 📖 🔖 🏷️ 📌 📍 📎 📐 📏 ✂️ 📅 ⏰ ⏱️ 💼 🏢 🏦 🏠 ✉️ 📧 📬
- **Creative, Design & Media**: 🎨 🖌️ 🖍️ 🎬 🎥 📸 📹 🖼️ 🎵 🎶 🎧 🎙️ 📻 📺 🔊 🔔
- **Gaming & Security**: 🎮 🕹️ 👾 🎯 🎲 🧩 🔒 🔓 🔑 🗝️ 🛡️ 🚨 👁️
- **Badges & Rewards**: ⭐ 🌟 ✨ 🔥 💎 🏆 🥇 🥈 🥉 💡 ☕ 🍕 🛒 🚗 ❤️ 💯 🪄
</details>

<details>
<summary><b>🌈 5. Wallpapers & Frosted Blur Customizer</b></summary>
<br/>
Switch between 12+ vibrant Apple-inspired presets (macOS Monterey Red/Purple, Big Sur Ocean, Sunset Glow, Cyberpunk Neon, Deep Midnight, Emerald Forest) or customize your own background colors and opacity.
</details>

---

## 🛠️ Tech Stack & Architecture

```
launchpad/
├── main.js                     # Electron main process, hotkey management & native IPC
├── preload.js                  # Context bridge exposing secure APIs to renderer
├── extract-icon-helper.ps1      # Native Win32 Shell & DLL icon extraction via C# P/Invoke
├── win-space-hook.ps1          # Low-level Windows keyboard hook for Win+Space interception
├── src/
│   ├── index.html              # Clean macOS-style Launchpad layout & settings dialog
│   ├── renderer.js             # UI state, drag-and-drop grid, search & icon rendering
│   └── style.css               # Glassmorphism, animations, responsive squircle grid
├── assets/                     # Application icons and branding assets
├── Launchpad.bat               # Fast launch script
├── Start-Launchpad-Silent.vbs  # Silent background execution for Windows Startup
├── install-to-startup.bat      # 1-click autostart installer
├── uninstall-from-startup.bat  # 1-click autostart uninstaller
└── package.json                # Project dependencies and electron-builder packaging config
```

- **Electron 40**: Powers the multi-window fullscreen canvas and hardware-accelerated rendering.
- **PowerShell Win32 P/Invoke**: Native Windows Shell integration (`SHGetFileInfo`, `ExtractIconEx`) ensures pixel-perfect icon extraction from `.exe`, `.lnk`, `.dll`, and `desktop.ini`.
- **CSS3 Glassmorphism**: High-performance backdrop blur and cubic-bezier animations matching macOS Launchpad.

---

## 🚀 Getting Started

### Prerequisites
- Windows 10 or Windows 11 (64-bit)
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (comes bundled with Node.js)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hannan-siddiqui/launchpad.git
   cd launchpad
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Launchpad**:
   ```bash
   npm start
   ```

Press <kbd>Win</kbd> + <kbd>Space</kbd> (or <kbd>Ctrl</kbd> + <kbd>Space</kbd>) anywhere in Windows to summon Launchpad!

---

## 📦 Building the Installer

To build the standalone Windows NSIS installer (`.exe`):

```bash
npm run dist
```

The output installer will be located in the `dist/` directory:
- `dist/Launchpad Setup 1.0.0.exe`

Double-click the setup file to install Launchpad as a native Windows desktop application.

---

## ⚙️ Configuration & Customization

Launchpad stores all custom app shortcuts, custom tabs, hotkey preferences, and wallpaper settings in:
```
%APPDATA%\macos-launchpad-winui\
├── launchpad_apps.json       # App order, custom icons, emojis, and tab associations
└── launchpad_settings.json   # Theme, opacity, global hotkey, and custom tabs
```

You can customize everything directly inside the app by clicking the **⚙️ Settings** icon in the upper-right corner of Launchpad.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/hannan-siddiqui/launchpad/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Crafted with ❤️ by <a href="https://github.com/hannan-siddiqui">Hannan Siddiqui</a></sub>
</div>
