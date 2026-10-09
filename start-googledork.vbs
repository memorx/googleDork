Set sh = CreateObject("WScript.Shell")
sh.Run "cmd /c cd /d C:\Users\guill\dev\googleDork && npm run preview -- --port 4173 --strictPort", 0, False
Set sh = Nothing
