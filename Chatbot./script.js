let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let imagebtn = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image input");
let historyBtn = document.querySelector("#history-btn");
let historyModal = document.querySelector("#historyModal");
let closeBtn = document.querySelector(".close-btn");
let historyList = document.querySelector("#historyList");

// Backend API URL - change this if your server runs on a different port
const BACKEND_URL = "http://localhost:3000";
const Api_Url = "//api url";

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

// Save prompt to backend database
async function savePromptToHistory(promptText) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: promptText })
        });
        
        if (!response.ok) {
            throw new Error("Failed to save chat history");
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error saving prompt history:", error);
    }
}

// Fetch chat history from backend
async function fetchChatHistory() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/history`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch chat history");
        }
        
        const data = await response.json();
        console.log("Fetched history:", data.length, "entries");
        displayChatHistory(data);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        // Show error in history modal
        historyList.innerHTML = `<div class="history-item">
            <div class="history-prompt">Error loading chat history. Please try again later.</div>
        </div>`;
    }
}

// Display chat history in the modal
function displayChatHistory(historyData) {
    historyList.innerHTML = "";
    
    if (historyData.length === 0) {
        historyList.innerHTML = `<div class="history-item">
            <div class="history-prompt">No chat history found.</div>
        </div>`;
        return;
    }
    
    historyData.forEach(item => {
        const timestamp = new Date(item.timestamp).toLocaleString();
        const historyItem = document.createElement("div");
        historyItem.classList.add("history-item");
        historyItem.innerHTML = `
            <div class="history-prompt">${item.prompt}</div>
            <div class="history-timestamp">${timestamp}</div>
        `;
        
        // Add click event to use this prompt
        historyItem.addEventListener("click", () => {
            prompt.value = item.prompt;
            historyModal.style.display = "none";
        });
        
        historyList.appendChild(historyItem);
    });
}

async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");
    let RequestOption = {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "contents": [
                { "parts": [{"text": user.message}, (user.file.data ? [{inline_data: user.file}] : [])]
                }]         
        })
    };
    try {
        let response = await fetch(Api_Url, RequestOption);
        let data = await response.json();
        let apiResponse = data.candidates[0].content.parts[0].text
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .trim();
        text.innerHTML = apiResponse;
    }
    catch(error) {
        console.log(error);
        text.innerHTML = "Sorry, I couldn't process your request. Please try again.";
    }
    finally {
        chatContainer.scrollTo({top: chatContainer.scrollHeight, behavior: "smooth"});
        image.src = `img.svg`;
        image.classList.remove("choose");
        user.file = {
            mime_type: null,
            data: null
        };
    }
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

async function handleChatResponse(message) {
    if (!message.trim()) return;
    
    user.message = message;
    let html = `<img src="user.png" alt="" id="userImage" width="50">
    <div class="user-chat-area">
    ${user.message}
    ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
    </div>`;

    prompt.value = "";   // after we submit input, input will be in null format

    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);    // we append userChatbox

    chatContainer.scrollTo({top: chatContainer.scrollHeight, behavior: "smooth"});

    // Save prompt to history
    await savePromptToHistory(message);

    setTimeout(() => {
        let html = `<img src="aii.png" alt="aiImage" id="aiImage" width="50">
        <div class="ai-chat-area">
        <img src="Rolling@1x-1.0s-200px-200px.webp" alt="" class ="load" width="50px">
        </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);
}

// Event Listeners
prompt.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && prompt.value.trim()) {
        handleChatResponse(prompt.value);
    }
});

submitbtn.addEventListener("click", () => {
    if (prompt.value.trim()) {
        handleChatResponse(prompt.value);
    }
});

imageinput.addEventListener("change", () => {
    const file = imageinput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        let base64string = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64string
        };
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        image.classList.add("choose");
    };

    reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
    imagebtn.querySelector("input").click();
});

// History Modal Event Listeners
historyBtn.addEventListener("click", () => {
    historyModal.style.display = "block";
    fetchChatHistory();
});

closeBtn.addEventListener("click", () => {
    historyModal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target == historyModal) {
        historyModal.style.display = "none";
    }
});



