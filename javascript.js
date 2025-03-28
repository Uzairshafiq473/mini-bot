

        // ========== Global Variables ==========
        let attachedFileContent = null;
        let lastMessageTime = 0;
        let currentLanguage = localStorage.getItem('lang') || 'en';
        let currentMode = localStorage.getItem('mode') || 'casual';
        const messages = JSON.parse(localStorage.getItem('chatHistory')) || [];
        const synth = window.speechSynthesis;

        // Theme functionality
        function toggleTheme() {
            const currentTheme = document.body.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }

        // Initialize theme from localStorage
        function initializeTheme() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            document.body.setAttribute('data-theme', savedTheme);
        }

        // Call initializeTheme on page load
        initializeTheme();

        // ترجمے کا ڈیٹا
        const translations = {
            en: {
                welcome: "Welcome! How can I assist you today? 😊",
                placeholder: "Type your message...",
                attach: "Attach File"
            },
            ur: {
                welcome: "خوش آمدید! آج آپ کی کیسے مدد کر سکتا ہوں؟ 😊",
                placeholder: "اپنا پیغام ٹائپ کریں...",
                attach: "فائل منسلک کریں"
            }
        };
        // زبان تبدیل کرنے کا فنکشن
        function setLanguage(lang) {
            currentLanguage = lang;
            document.getElementById('user-input').placeholder = translations[lang].placeholder;
            document.querySelector('.file-label').textContent = `📎 ${translations[lang].attach}`;
        }

        // تھیم ٹوگل فنکشن
        function toggleTheme() {
            const theme = document.body.getAttribute('data-theme') || 'dark';
            document.body.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
            localStorage.setItem('theme', theme);
        }





        // Voice Recognition
        function startVoiceRecognition() {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'en-US';
            recognition.onresult = (event) => {
                document.getElementById('user-input').value = event.results[0][0].transcript;
            };
            recognition.start();
        }

        // File Handling
        document.getElementById('file-input').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const allowedTypes = ['text/plain'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only TXT files allowed!');
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                attachedFileContent = e.target.result;
                document.getElementById('file-name').textContent = file.name;
            };
            reader.readAsText(file);
        });

        async function sendMessage() {
            const userInput = document.getElementById('user-input');
            let message = userInput.value.trim();

            // File handling logic
            if (!message && attachedFileContent) {
                message = "Here is the content of my file. Analyze it and respond:\n";
            }
            if (attachedFileContent) {
                message += `\n\n[File Content]:\n${attachedFileContent}`;
                attachedFileContent = null;
                document.getElementById('file-input').value = '';
                document.getElementById('file-name').textContent = 'No file chosen';
            }

            const chatBox = document.getElementById('chat-box');

            // Add user message with animation
            const userDiv = document.createElement('div');
            userDiv.className = 'message user-message';
            userDiv.textContent = message.split('\n')[0];
            chatBox.appendChild(userDiv);

            // Add typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
            chatBox.appendChild(typingIndicator);

            // Clear input and scroll
            userInput.value = '';
            chatBox.scrollTop = chatBox.scrollHeight;

            try {
                const response = await getAIResponse(message);

                // Remove typing indicator
                typingIndicator.remove();

                // Add bot response with animation
                const botDiv = document.createElement('div');
                botDiv.className = 'message bot-message';
                botDiv.innerHTML = formatResponse(response);
                chatBox.appendChild(botDiv);

                // Add copy button and speak
                addCopyButton(botDiv);
                

            } catch (error) {
                // Remove typing indicator on error
                typingIndicator.remove();

                const errorDiv = document.createElement('div');
                errorDiv.className = 'message bot-message';
                errorDiv.innerHTML = `<span style="color: #ff6b6b;">Error: ${error.message}</span>`;
                chatBox.appendChild(errorDiv);
            }
        }

        // API Handling
        async function getAIResponse(prompt) {
            const response = await fetch('https://uzair-gpt-backend.onrender.com/api/openrouter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            return await response.json();
        }
        // Utilities
        function formatResponse(text) {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>') // Code blocks
                .replace(/\n/g, '<br>');
        }

        function addCopyButton(element) {
            const btn = document.createElement('button');
            btn.innerHTML = '📋';
            btn.style = 'position: absolute; right: 10px; bottom: 5px; background: none; border: none; cursor: pointer;';
            btn.onclick = () => {
                navigator.clipboard.writeText(element.innerText);
                btn.innerHTML = '✔️';
                setTimeout(() => btn.innerHTML = '📋', 2000);
            };
            element.appendChild(btn);
        }

        // Add this code to handle file uploads
        document.getElementById('file-input').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type and size (only allows TXT files under 1MB)
            if (file.type !== "text/plain" || file.size > 1024 * 1024) {
                alert("Only TXT files allowed (max 1MB)!");
                e.target.value = ''; // Reset file input
                return;
            }

            // Read file content
            const reader = new FileReader();
            reader.onload = (e) => {
                attachedFileContent = e.target.result; // Save content to global variable
                document.getElementById('file-name').textContent = file.name; // Show filename
            };
            reader.onerror = (e) => {
                alert("Error reading file!");
            };
            reader.readAsText(file); // Read as text
        });
   