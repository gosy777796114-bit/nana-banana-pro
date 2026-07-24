$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("d:\Nana_and_Banana_Pro_تطبيق_نانه_وبنانه_برو\تطبيق نانه وبنانه برو.lnk")
$Shortcut.TargetPath = "d:\Nana_and_Banana_Pro_تطبيق_نانه_وبنانه_برو\تشغيل_التطبيق.bat"
$Shortcut.WorkingDirectory = "d:\Nana_and_Banana_Pro_تطبيق_نانه_وبنانه_برو"
$Shortcut.IconLocation = "d:\Nana_and_Banana_Pro_تطبيق_نانه_وبنانه_برو\icon.ico"
$Shortcut.Save()
Write-Host "Shortcut created successfully."
