# Bluetooth Keyboard Missing Letters - Troubleshooting

## Problem
Bluetooth keyboard drops letters while typing (e.g., "typing" → "yping", "letters" → "etters").

## Tried So Far

### 1. Bluetooth config changes
Edited `/etc/bluetooth/main.conf`:
- Added `FastConnectable=true` under `[General]`
- Added `AutoEnable=true` under `[Policy]`
- Restarted: `sudo systemctl restart bluetooth`
- **Result:** Still missing letters

### 2. USB autosuspend disabled via GRUB
Edited `/etc/default/grub`:
```
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash usbcore.autosuspend=-1"
```
Ran `sudo update-grub && sudo reboot`
- **Result:** Still missing letters

### 3. Tried changing BLE connection params
```bash
sudo hcitool lecup --handle <handle> --min 6 --max 9 --latency 0
```
- **Result:** Input/output error - command not supported

## Still To Try

### Test WiFi interference
```bash
nmcli radio wifi off
# Type a paragraph to test
nmcli radio wifi on  # Turn back on after
```

### Check adapter info
```bash
lsusb | grep -i bluetooth
hciconfig -a
bluetoothctl info
```

### Other options
- Try a different Bluetooth adapter (some cheap ones perform poorly on Linux)
- Check/replace keyboard battery
- Re-pair the keyboard completely
- Check `journalctl -u bluetooth -f` for errors while typing
- Try a different kernel version

## Notes
- Keyboard model: (not yet identified)
- Bluetooth adapter: (not yet identified)
