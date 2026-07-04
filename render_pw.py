from playwright.sync_api import sync_playwright
p=sync_playwright().start()
browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
page=browser.new_page(viewport={'width':393,'height':873}, device_scale_factor=2.75, is_mobile=True, has_touch=True)
page.goto('http://127.0.0.1:8844/android.html', wait_until='networkidle')
page.screenshot(path='/mnt/data/android_render.png', full_page=True)
print('height', page.evaluate('document.documentElement.scrollHeight'))
# print computed sizes
for sel in ['.android-app-row','.android-store-stack .image-badge','.android-store-stack .badge-img','.android-brand-block','.brand-footer-text','.android-logo']:
  print(sel, page.eval_on_selector(sel, 'e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height, cls:e.className, style:getComputedStyle(e).cssText})'))
browser.close(); p.stop()
