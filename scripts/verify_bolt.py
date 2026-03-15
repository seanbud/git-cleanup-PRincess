
import json
from playwright.sync_api import sync_playwright, expect

def verify_bolt_optimizations(page):
    # Mock electronAPI for the web environment
    page.add_init_script("""
        window.electronAPI = {
            githubIsAuthenticated: () => Promise.resolve(true),
            githubGetUser: () => Promise.resolve({ login: 'bolt-tester', avatar_url: '' }),
            getRecentRepos: () => Promise.resolve([]),
            getAppSettings: () => Promise.resolve({ externalEditor: 'code', shell: 'bash' }),
            gitCmd: (args) => {
                console.log('Git command:', args.join(' '));
                if (args[0] === 'status') {
                    return Promise.resolve({ success: true, stdout: ' M file1.ts\\n M file2.ts\\n' });
                }
                if (args[0] === 'rev-parse') return Promise.resolve({ success: true, stdout: 'main' });
                if (args[0] === 'branch') return Promise.resolve({ success: true, stdout: '* main' });
                if (args[0] === 'diff' && args.includes('--numstat')) {
                    return Promise.resolve({ success: true, stdout: '10\\t5\\tfile1.ts\\n2\\t1\\tfile2.ts' });
                }
                if (args[0] === 'log') {
                    return Promise.resolve({ success: true, stdout: 'hash1|parent1|message1|refs1|author1' });
                }
                return Promise.resolve({ success: true, stdout: '' });
            },
            gitConfigGet: () => Promise.resolve(''),
            trashFile: (path) => Promise.resolve({ success: true })
        };
    """)

    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Verify files are listed (proves getStatusFiles worked)
    expect(page.get_by_text("file1.ts")).to_be_visible()
    expect(page.get_by_text("file2.ts")).to_be_visible()

    # Click Select All (triggers handleSelectionChange)
    page.get_by_label("Select all filtered files").click()
    page.wait_for_timeout(500)

    # Click "Restore to Upstream" (triggers handleAction -> discardChanges)
    page.get_by_role("button", name="Restore to Upstream").click()
    page.wait_for_timeout(500)

    # Confirm the action in modal (updated button name with emoji)
    page.get_by_role("button", name="✨ Restore", exact=True).click()

    # Wait for the "sparkle" animation/processing state
    page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/bolt_verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        try:
            verify_bolt_optimizations(page)
        finally:
            context.close()
            browser.close()
