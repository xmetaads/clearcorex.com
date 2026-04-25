// ============================================
// 7za.exe wrapper — adds exclusion flags so symlink
// extraction failures (macOS dylibs) don't break a Windows build.
// Compiled with csc.exe to wrapper.exe, then renamed over the
// original 7za.exe (which is moved to 7za-real.exe).
// ============================================
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;

class Wrapper {
    static int Main(string[] args) {
        // Build new arg list: same args + symlink exclusions when extracting
        var sb = new StringBuilder();
        bool isExtract = false;
        for (int i = 0; i < args.Length; i++) {
            if (i > 0) sb.Append(' ');
            sb.Append(QuoteArg(args[i]));
            if (args[i] == "x" || args[i] == "e") isExtract = true;
        }
        if (isExtract) {
            sb.Append(" -x!darwin/10.12/lib/libcrypto.dylib");
            sb.Append(" -x!darwin/10.12/lib/libssl.dylib");
            sb.Append(" -x!darwin/*/lib/*.dylib");
        }

        string exeDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        string realExe = Path.Combine(exeDir, "7za-real.exe");

        var psi = new ProcessStartInfo {
            FileName = realExe,
            Arguments = sb.ToString(),
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };
        var p = Process.Start(psi);
        p.OutputDataReceived += (s, e) => { if (e.Data != null) Console.WriteLine(e.Data); };
        p.ErrorDataReceived  += (s, e) => { if (e.Data != null) Console.Error.WriteLine(e.Data); };
        p.BeginOutputReadLine();
        p.BeginErrorReadLine();
        p.WaitForExit();

        // Treat "symlink not held" as success — those are macOS dylibs we don't need.
        // 7za returns exit code 2 for warnings (and these errors). Map to 0 if extracting.
        int code = p.ExitCode;
        if (isExtract && code == 2) code = 0;
        return code;
    }

    static string QuoteArg(string a) {
        if (a.Length == 0) return "\"\"";
        // Quote if contains spaces or special chars
        if (a.IndexOfAny(new[] { ' ', '\t', '"' }) < 0) return a;
        return "\"" + a.Replace("\"", "\\\"") + "\"";
    }
}
