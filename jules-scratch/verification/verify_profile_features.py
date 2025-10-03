import re
from playwright.sync_api import Page, expect

def test_profile_and_avatar_update(page: Page):
    """
    This test verifies that a user can:
    1. Register a new account.
    2. Log in with that account.
    3. Open the profile editing modal.
    4. Update their bio and website.
    5. Upload a new avatar image.
    6. See the changes reflected in the UI.
    """
    # 1. Go to the application
    page.goto("http://localhost:8787")

    # --- Register a new user ---
    page.get_by_role("link", name="Register").click()

    # Use a unique username and email to ensure the test is repeatable
    username = f"testuser_{page.evaluate('() => Math.random().toString(36).substr(2, 5)')}"
    email = f"{username}@test.com"

    # Fill out the registration form
    expect(page.get_by_label("Username")).to_be_visible()
    page.get_by_label("Username").fill(username)
    page.get_by_label("Email").fill(email)
    page.get_by_label("Password").fill("password123")
    page.get_by_role("button", name="Register").click()

    # --- Log in with the new user ---
    expect(page.get_by_label("Email")).to_be_visible()
    page.get_by_label("Email").fill(email)
    page.get_by_label("Password").fill("password123")
    page.get_by_role("button", name="Login").click()

    # --- Verify login and open profile modal ---
    expect(page.get_by_text(f"Welcome, {username}")).to_be_visible(timeout=10000)
    page.get_by_role("link", name="My Profile").click()

    # --- Update profile information ---
    expect(page.get_by_label("Bio")).to_be_visible()

    # Set the avatar input
    avatar_input = page.locator("input#profile-avatar")
    avatar_input.set_input_files("public/favicon.png")

    # Fill in other profile fields
    page.get_by_label("Bio").fill("This is my new bio.")
    page.get_by_label("Website").fill("https://example.com")

    page.get_by_role("button", name="Save Changes").click()

    # --- Verify the changes ---
    # Check for the success toast
    expect(page.get_by_text("Profile updated successfully")).to_be_visible()

    # Check that the avatar in the navbar has updated
    # It should now point to an R2 URL, not gravatar
    avatar_image = page.locator("#user-avatar-container img")
    expect(avatar_image).to_have_attribute("src", re.compile(r"https://odd-img\.distorted\.work/avatars/.*"))

    # Re-open the profile modal to verify the text fields
    page.get_by_role("link", name="My Profile").click()
    expect(page.get_by_label("Bio")).to_have_value("This is my new bio.")
    expect(page.get_by_label("Website")).to_have_value("https://example.com")

    # Take a screenshot of the verified profile modal
    page.screenshot(path="jules-scratch/verification/profile_verification.png")