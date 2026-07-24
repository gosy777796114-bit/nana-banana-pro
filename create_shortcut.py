import os
import subprocess

def create_shortcut():
    desktop = os.path.abspath(os.path.dirname(__file__))
    path = os.path.join(desktop, "تطبيق نانه وبنانه برو.lnk")
    target = os.path.join(desktop, "تشغيل_التطبيق.bat")
    icon = os.path.join(desktop, "icon.ico")
    
    vbs_path = os.path.join(desktop, "create_shortcut.vbs")
    
    vbs_content = f"""
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{path}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "{target}"
oLink.WorkingDirectory = "{desktop}"
oLink.IconLocation = "{icon}"
oLink.Save
"""
    with open(vbs_path, "w", encoding="utf-16le") as f:
        f.write("\ufeff" + vbs_content) # Add BOM for UTF-16LE
    
    subprocess.check_call(["cscript", "//nologo", vbs_path])
    os.remove(vbs_path)
    print("Shortcut created successfully")

if __name__ == '__main__':
    create_shortcut()
