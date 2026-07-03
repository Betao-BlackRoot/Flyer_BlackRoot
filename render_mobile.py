from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
opts=Options(); opts.add_argument('--headless=new'); opts.add_argument('--no-sandbox'); opts.add_argument('--disable-dev-shm-usage'); opts.add_argument('--window-size=393,873')
opts.add_experimental_option('mobileEmulation', {'deviceMetrics': {'width':393,'height':873,'pixelRatio':2.75}, 'userAgent':'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'})
driver=webdriver.Chrome(options=opts)
url=Path('/mnt/data/fix_android/android.html').as_uri()
driver.get(url)
time.sleep(1)
driver.save_screenshot('/mnt/data/android_render.png')
print(driver.execute_script('return document.documentElement.scrollHeight'))
driver.quit()
