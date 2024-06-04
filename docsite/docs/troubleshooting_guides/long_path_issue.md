---
sidebar_position: 1
---

# Long Path Issue On Windows 10

If you are encountering an error with Ninja on Windows due to long paths not being enabled typically means that the path to your project or files is too long for Ninja to handle. Windows has a limitation on the maximum length of file paths, and if your project's path exceeds this limit, Ninja may fail to execute properly. 

To resolve this, you can either enable long paths in Windows or try moving your project to a shorter path.

## How To Enable Long Paths 

To enable the new long path behavior on your machine:

- Use the registry key
**Computer\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled (Type: REG_DWORD)** must exist and be set to 1.
In order for all apps on the system to recognize the value of the key, a reboot might be required because some processes may have started before the key was set.

- Using PowerShell 
 You can also enable long paths by using the PowerShell command from a terminal window with elevated privileges:

 ```bash
 New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
-Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```
## For More Information or Help on Long Paths 

https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=registry#enable-long-paths-in-windows-10-version-1607-and-later
