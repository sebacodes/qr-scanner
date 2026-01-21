# QR Scan - VirusTotal 

QR Scan its a PWA that let's user to scan QR codes using virus total API to prevent access to malicious sites. 


## Requirements

- VirusTotal API key (free tier available at [virustotal.com](https://www.virustotal.com/gui/join-us))
- Modern browser with camera access
- HTTPS connection (required for camera permissions)


##  Security Disclaimer

This is not a definitive solution as there are many ways an attacker can still use QR codes to attack like:

- Zero-day phishing site, too new to be in Virus Totl database
- malformed QR codes still can exploit scanner vulnerabilities
- Legit-looking fake sites
- Malicious payloads in the QR itself
- Auto-opening URLs
- Data exfiltration, like QR codes with tracking pixels


## Real-world attack scenarios:

1. Fake parking meter QR → Brand new phishing site → VirusTotal has no data yet → Shows as "safe"
2. Malicious WiFi QR → Contains credentials that auto-connect → Phone connects before you can check
3. Unicode homograph attack → e.g. paypaI.com (capital i looks like lowercase L) → Passes VirusTotal
4. PDF/File QR → Downloads malware directly → VirusTotal might not catch it in time

The above Real-world attack scenarios would be covered in further releases.


## Best Practices

- Always review the full URL before opening it
- Be suspicious of QR codes in public places or unsolicited messages
- Verify the URL matches the expected domain
- When in doubt, manually type the URL instead