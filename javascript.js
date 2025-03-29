

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




async function sendMessage() {
    const userInput = document.getElementById('user-input');
    let message = userInput.value.trim();

    // File handling logic
    if (!message && attachedFileContent) {
        message = "Here is the content of my file. Analyze it and respond:\n";
    }
    if (attachedFileContent) {
        // چیک کریں اگر فائل میں کوڈ ہے
        if (attachedFileContent.includes('import ') || 
            attachedFileContent.includes('def ') || 
            attachedFileContent.includes('class ')) {
            message += `\n\n[${translations[currentLanguage].code_attached}]:\n` +
                      '```python\n' + attachedFileContent + '\n```';
        } else {
            message += `\n\n[File Content]:\n${attachedFileContent}`;
        }
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
    const response = await fetch('https://favourite-bette-pzmeer-db6fe353.koyeb.app/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    return await response.json();
}
// Utilities
// جاواسکرپٹ کوڈ میں یہ تبدیلی کریں
function formatResponse(text) {
    // کوڈ بلاکس کو ہینڈل کرنے کا بہتر طریقہ
    text = text.replace(/```python([\s\S]*?)```/g, 
        '<div class="code-block"><span class="lang">Python</span><pre><code>$1</code></pre></div>');
    
    // باقی فارمیٹنگ
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
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


// File Handling - Updated for multiple file types

// File Handling - Updated Version with 20MB limit and improved error handling
document.getElementById('file-input').addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // Allowed file types
    const allowedTypes = [
        'text/plain',           // .txt
        'application/pdf',      // .pdf
        'application/msword',   // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    // Validation
    if (!allowedTypes.includes(file.type) && !['.txt','.pdf','.doc','.docx'].includes(fileExtension)) {
        alert('Only TXT, PDF, DOC, and DOCX files allowed (max 20MB)!');
        e.target.value = '';
        return;
    }

    // File size check (now 20MB)
    if (file.size > 20 * 1024 * 1024) {
        alert('File size exceeds 20MB limit!');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            let content = '';
            
            if (fileExtension === '.pdf') {
                // Use the already loaded PDF.js from your head section
                const loadingTask = pdfjsLib.getDocument({data: new Uint8Array(e.target.result)});
                const pdf = await loadingTask.promise;
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    content += textContent.items.map(item => item.str).join(' ');
                }
            } 
            else if (fileExtension === '.docx') {
                // Use the already loaded Mammoth.js from your head section
                const result = await mammoth.extractRawText({arrayBuffer: e.target.result});
                content = result.value;
            }
            else {
                // Plain text (TXT/DOC)
                content = e.target.result;
            }
            
            attachedFileContent = content;
            document.getElementById('file-name').textContent = file.name;
        } catch (error) {
            console.error("File processing error:", error);
            alert("Error processing file. The file might be corrupted or in an unexpected format. Please try another file.");
            e.target.value = '';
            document.getElementById('file-name').textContent = 'No file chosen';
            attachedFileContent = null;
        }
    };

    // Read differently based on file type
    if (fileExtension === '.pdf' || fileExtension === '.docx') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
});