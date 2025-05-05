document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const prompterText = document.getElementById('prompter-text');
    const speedSelect = document.getElementById('speed');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-btn');
    const teleprompterWindow = document.querySelector('.teleprompter-window');
    const markdownHelp = document.getElementById('markdown-help');
    const markdownOverlay = document.getElementById('markdown-overlay');
    const closeBtn = document.querySelector('.close-btn');
    const resumeBtn = document.getElementById('resume-btn');

    let scrollInterval;
    let currentPosition = 75;
    let isScrolling = false;
    let isManualScrolling = false;
    let lastTouchY = 0;
    let currentSpeed = 2; // Default speed
    let isPaused = false;
    let pauseCooldown = false;

    // Save text to localStorage
    function saveToStorage() {
        localStorage.setItem('teleprompterText', inputText.value);
    }

    // Load text from localStorage
    function loadFromStorage() {
        const savedText = localStorage.getItem('teleprompterText');
        if (savedText) {
            inputText.value = savedText;
            updatePrompterText();
        }
    }

    // Convert markdown to HTML and update the prompter text
    function updatePrompterText() {
        const markdownText = inputText.value;
        const lines = markdownText.split('\n');
        let htmlLines = [];
        lines.forEach((line) => {
            if (/^\s*pause\s*$/i.test(line)) {
                htmlLines.push('<div class="prompter-line pause-line">PAUSE</div>');
            } else {
                htmlLines.push(`<div class="prompter-line">${marked.parseInline(line)}</div>`);
            }
        });
        prompterText.innerHTML = htmlLines.join('');
        resetPrompter();
        saveToStorage();
    }

    // Helper: get the .pause-line currently at the vertical center of the teleprompter window
    function isPauseLineAtRedLine() {
        const pauseLines = prompterText.querySelectorAll('.pause-line');
        if (!pauseLines.length) return false;
        const windowRect = teleprompterWindow.getBoundingClientRect();
        const redLineY = windowRect.top + windowRect.height / 2;
        for (const pauseLine of pauseLines) {
            const rect = pauseLine.getBoundingClientRect();
            if (rect.top <= redLineY && rect.bottom >= redLineY) {
                return true;
            }
        }
        return false;
    }

    // Start scrolling
    function startScrolling() {
        if (isScrolling || isPaused) return;
        pauseCooldown = true;
        setTimeout(() => { pauseCooldown = false; }, 5000);
        isScrolling = true;
        currentSpeed = parseInt(speedSelect.value);
        
        scrollInterval = setInterval(() => {
            const scrollStep = currentSpeed * 0.1;
            currentPosition -= scrollStep;
            prompterText.style.transform = `translateY(${currentPosition}vh)`;
            
            // Check for PAUSE line at the red line
            if (!pauseCooldown && isPauseLineAtRedLine()) {
                stopScrolling();
                isPaused = true;
                resumeBtn.style.display = 'block';
                return;
            }

            // Stop when text has scrolled completely off screen
            if (currentPosition < -100) {
                stopScrolling();
            }
        }, 50);
    }

    // Stop scrolling
    function stopScrolling() {
        isScrolling = false;
        clearInterval(scrollInterval);
    }

    // Reset the prompter
    function resetPrompter() {
        stopScrolling();
        currentPosition = 75;
        prompterText.style.transform = `translateY(${currentPosition}vh)`;
    }

    // Handle mouse wheel scrolling
    teleprompterWindow.addEventListener('wheel', (e) => {
        e.preventDefault();
        stopScrolling();
        const scrollAmount = e.deltaY * 0.02;
        // Flip the direction: negative deltaY (scroll up) moves text down
        currentPosition -= scrollAmount;
        prompterText.style.transform = `translateY(${currentPosition}vh)`;
    });

    // Handle touch scrolling
    teleprompterWindow.addEventListener('touchstart', (e) => {
        lastTouchY = e.touches[0].clientY;
    });

    teleprompterWindow.addEventListener('touchmove', (e) => {
        e.preventDefault();
        stopScrolling();
        const touchY = e.touches[0].clientY;
        const deltaY = lastTouchY - touchY;
        lastTouchY = touchY;
        
        // Flip the direction: negative deltaY (swipe up) moves text down
        currentPosition -= deltaY * 0.2;
        prompterText.style.transform = `translateY(${currentPosition}vh)`;
    });

    // Show markdown help overlay
    markdownHelp.addEventListener('click', (e) => {
        e.preventDefault();
        markdownOverlay.style.display = 'block';
    });

    // Close markdown help overlay
    closeBtn.addEventListener('click', () => {
        markdownOverlay.style.display = 'none';
    });

    // Close overlay when clicking outside the content
    window.addEventListener('click', (e) => {
        if (e.target === markdownOverlay) {
            markdownOverlay.style.display = 'none';
        }
    });

    // Event listeners
    inputText.addEventListener('input', updatePrompterText);
    startBtn.addEventListener('click', startScrolling);
    stopBtn.addEventListener('click', stopScrolling);
    resetBtn.addEventListener('click', resetPrompter);
    
    // Add speed change listener
    speedSelect.addEventListener('change', () => {
        currentSpeed = parseInt(speedSelect.value);
    });

    resumeBtn.addEventListener('click', () => {
        if (isPaused) {
            isPaused = false;
            resumeBtn.style.display = 'none';
            pauseCooldown = true;
            setTimeout(() => { pauseCooldown = false; }, 5000);
            startScrolling();
        }
    });

    // Initialize
    loadFromStorage(); // Load saved text on startup
}); 