Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class WinHook {
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;
    private const int WM_KEYUP = 0x0101;
    private const int WM_SYSKEYDOWN = 0x0104;
    private const int WM_SYSKEYUP = 0x0105;

    private const int VK_SPACE = 0x20;
    private const int VK_LWIN = 0x5B;
    private const int VK_RWIN = 0x5C;

    private static volatile bool _winDown = false;

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("user32.dll")]
    private static extern short GetAsyncKeyState(int vKey);

    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
    private static LowLevelKeyboardProc _proc = HookCallback;
    private static IntPtr _hookID = IntPtr.Zero;

    public static void Start() {
        using (Process curProcess = Process.GetCurrentProcess())
        using (ProcessModule curModule = curProcess.MainModule) {
            _hookID = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, GetModuleHandle(curModule.ModuleName), 0);
        }
        Application.Run();
        UnhookWindowsHookEx(_hookID);
    }

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0) {
            int msg = (int)wParam;
            int vkCode = Marshal.ReadInt32(lParam);

            if (vkCode == VK_LWIN || vkCode == VK_RWIN) {
                if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN) {
                    _winDown = true;
                } else if (msg == WM_KEYUP || msg == WM_SYSKEYUP) {
                    _winDown = false;
                }
            } else {
                bool lWinAsync = (GetAsyncKeyState(VK_LWIN) & 0x8000) != 0;
                bool rWinAsync = (GetAsyncKeyState(VK_RWIN) & 0x8000) != 0;
                bool anyWinDown = lWinAsync || rWinAsync;

                // If Win key is not physically pressed down, force _winDown to false
                if (!anyWinDown) {
                    _winDown = false;
                }

                if (vkCode == VK_SPACE && (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN)) {
                    // Space pressed: only trigger TOGGLE if Win key is physically held down AND tracked
                    if (_winDown && anyWinDown) {
                        Console.WriteLine("TOGGLE");
                        Console.Out.Flush();
                        return (IntPtr)1; // Consume Win+Space so Windows language bar doesn't open
                    }
                }
            }
        }
        return CallNextHookEx(_hookID, nCode, wParam, lParam);
    }
}
"@ -ReferencedAssemblies "System.Windows.Forms"

[WinHook]::Start()
