from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_frontend(page: Page):
    # Mock window.electronAPI
    page.add_init_script("""
        window.electronAPI = {
            githubIsAuthenticated: () => Promise.resolve(true),
            githubGetUser: () => Promise.resolve({ login: 'testuser', avatar_url: '' }),
            getAppSettings: () => Promise.resolve({ externalEditor: 'code', shell: 'bash' }),
            getRecentRepos: () => Promise.resolve(['/path/to/repo']),
            gitCmd: (args) => {
                if (args[0] === 'status') {
                    return Promise.resolve({ success: true, stdout: ' M file1.ts\\n?? file2.ts\\n' });
                }
                if (args[0] === 'rev-parse' && args[1] === '--abbrev-ref') {
                    return Promise.resolve({ success: true, stdout: 'main\\n' });
                }
                if (args[0] === 'remote' && args[1] === 'get-url') {
                    return Promise.resolve({ success: true, stdout: 'https://github.com/test/repo.git\\n' });
                }
                if (args[0] === 'branch') {
                    return Promise.resolve({ success: true, stdout: '* main\\n' });
                }
                if (args[0] === 'log') {
                    return Promise.resolve({ success: true, stdout: 'h1|p1|msg|D|auth\\n' });
                }
                if (args[0] === 'diff' && args[1] === '--numstat') {
                    return Promise.resolve({ success: true, stdout: '10\\t5\\tfile1.ts\\n' });
                }
                return Promise.resolve({ success: true, stdout: '' });
            },
            gitConfigGet: (key) => Promise.resolve('test'),
            on: () => {},
            send: () => {},
        };
    """)

    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Take a screenshot to verify UI is rendered
    os.makedirs("/home/jules/verification", exist_ok=True)
    page.screenshot(path="/home/jules/verification/verification.png")

    # Check if files are visible
    expect(page.get_by_text("file1.ts")).to_be_visible()
    expect(page.get_by_text("file2.ts")).to_be_visible()

    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        try:
            verify_frontend(page)
        finally:
            context.close()
            browser.close()
