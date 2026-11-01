param(
    [string]$Path,
    [string]$DllFile,
    [int]$Index = 0
)

Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public class NativeIconHelper {
    private const uint SHGFI_ICON = 0x000000100;
    private const uint SHGFI_LARGEICON = 0x000000000;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    private struct SHFILEINFO {
        public IntPtr hIcon;
        public int iIcon;
        public uint dwAttributes;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
        public string szDisplayName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)]
        public string szTypeName;
    }

    [DllImport("shell32.dll", CharSet = CharSet.Auto)]
    private static extern IntPtr SHGetFileInfo(string pszPath, uint dwFileAttributes, ref SHFILEINFO psfi, uint cbFileInfo, uint uFlags);

    [DllImport("shell32.dll", CharSet = CharSet.Auto)]
    private static extern int ExtractIconEx(string lpszFile, int nIconIndex, out IntPtr phiconLarge, out IntPtr phiconSmall, int nIcons);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool DestroyIcon(IntPtr hIcon);

    public static string GetShellIcon(string path) {
        SHFILEINFO shinfo = new SHFILEINFO();
        IntPtr res = SHGetFileInfo(path, 0, ref shinfo, (uint)Marshal.SizeOf(shinfo), SHGFI_ICON | SHGFI_LARGEICON);
        if (res == IntPtr.Zero || shinfo.hIcon == IntPtr.Zero) return null;

        try {
            using (Icon icon = Icon.FromHandle(shinfo.hIcon))
            using (Bitmap bmp = icon.ToBitmap())
            using (MemoryStream ms = new MemoryStream()) {
                bmp.Save(ms, ImageFormat.Png);
                return "data:image/png;base64," + Convert.ToBase64String(ms.ToArray());
            }
        } finally {
            DestroyIcon(shinfo.hIcon);
        }
    }

    public static string ExtractFromModule(string file, int index) {
        IntPtr hLarge = IntPtr.Zero;
        IntPtr hSmall = IntPtr.Zero;
        int res = ExtractIconEx(file, index, out hLarge, out hSmall, 1);
        IntPtr target = hLarge != IntPtr.Zero ? hLarge : hSmall;
        if (target == IntPtr.Zero) return null;

        try {
            using (Icon icon = Icon.FromHandle(target))
            using (Bitmap bmp = icon.ToBitmap())
            using (MemoryStream ms = new MemoryStream()) {
                bmp.Save(ms, ImageFormat.Png);
                return "data:image/png;base64," + Convert.ToBase64String(ms.ToArray());
            }
        } finally {
            if (hLarge != IntPtr.Zero) DestroyIcon(hLarge);
            if (hSmall != IntPtr.Zero) DestroyIcon(hSmall);
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing"

if (![string]::IsNullOrEmpty($DllFile)) {
    $out = [NativeIconHelper]::ExtractFromModule($DllFile, $Index)
    if ($out) { Write-Output $out }
} elseif (![string]::IsNullOrEmpty($Path)) {
    $out = [NativeIconHelper]::GetShellIcon($Path)
    if ($out) { Write-Output $out }
}
