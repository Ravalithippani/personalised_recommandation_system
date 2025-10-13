from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# Set up driver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
wait = WebDriverWait(driver, 15)  # Increased timeout for stability

try:
    # Test Case 1: Verify Login UI
    driver.get("http://127.0.0.1:8000/login.html")  # Local frontend server
    email_input = wait.until(EC.presence_of_element_located((By.ID, "signinEmail")))
    email_input.send_keys("test123@gmail.com")
    password_input = driver.find_element(By.ID, "signinPassword")
    password_input.send_keys("Password@123")
    submit_btn = driver.find_element(By.CSS_SELECTOR, ".auth-btn")
    submit_btn.click()
    wait.until(EC.url_contains("index.html"))  # Wait for redirect
    print("TC-UI-01: Login UI - PASS")

    # Test Case 2: Verify Search UI


    # Test Case 4: Verify Books Section UI
    driver.get("http://127.0.0.1:8000/index.html")
    wait.until(EC.invisibility_of_element_located((By.ID, "loadingScreen")))  # Wait for loading screen
    books_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@data-category='books']")))
    driver.execute_script("arguments[0].scrollIntoView(true);", books_tab)  # Scroll to element
    books_tab.click()
    wait.until(EC.presence_of_element_located((By.ID, "booksSection")))  # Wait for section
    time.sleep(2)  # Extra wait for animations
    books_section = driver.find_element(By.ID, "booksSection")
    assert books_section.is_displayed(), "Books section not displayed"
    book_cards = driver.find_elements(By.CLASS_NAME, "recommendation-card")
    assert len(book_cards) >= 5, "Less than 5 book cards displayed"
    print("TC-UI-04: Books Section UI - PASS")

    # Test Case 5: Verify Music Section UI
    music_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@data-category='music']")))
    driver.execute_script("arguments[0].scrollIntoView(true);", music_tab)  # Scroll to element
    music_tab.click()
    wait.until(EC.invisibility_of_element_located((By.ID, "loadingScreen")))  # Ensure no loading overlay
    wait.until(EC.presence_of_element_located((By.ID, "musicSection")))  # Wait for section
    time.sleep(3)  # Increased wait for stability
    music_section = driver.find_element(By.ID, "musicSection")
    assert music_section.is_displayed(), "Music section not displayed"
    music_cards = driver.find_elements(By.CLASS_NAME, "recommendation-card")
    assert len(music_cards) >= 5, "Less than 5 music cards displayed"
    print("TC-UI-05: Music Section UI - PASS")

    driver.get("http://127.0.0.1:8000/favorites.html")
    wait.until(EC.invisibility_of_element_located((By.ID, "loadingScreen")))  # Wait for loading screen
    personalized_btn = wait.until(EC.presence_of_element_located((By.ID, "personalizedBtn")))
    personalized_btn.click()
    time.sleep(15)
    picks = driver.find_elements(By.CLASS_NAME, "personalized-card")
    assert len(picks) > 0, "No personalized picks displayed"
    print("TC-UI-03: Favorites UI - PASS")


    driver.get("http://127.0.0.1:8000/index.html")
    wait.until(EC.invisibility_of_element_located((By.ID, "loadingScreen")))  # Wait for loading screen
    search_input = wait.until(EC.presence_of_element_located((By.ID, "searchInput")))
    search_input.send_keys("Toy Story")
    recommend_btn = driver.find_element(By.ID, "recommendBtn")
    recommend_btn.click()
    time.sleep(15)  # Wait for API response and rendering
    results = driver.find_elements(By.CLASS_NAME, "recommendation-card")
    assert len(results) > 0, "No results displayed"
    print("TC-UI-02: Search UI - PASS")

    # Test Case 3: Verify Favorites UI
   

except Exception as e:
    print(f"Test failed: {e}")
finally:
    driver.quit()