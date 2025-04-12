const btn = document.querySelector("#btn");
const content = document.querySelector("#content");
const voice = document.querySelector("#voice");

const GEMINI_API_KEY = "// Replace with your actual Gemini API key";  // Replace with your actual Gemini API key

// 🗣️ Sultry, clear, loud voice function
function speak(text) {
  const text_speak = new SpeechSynthesisUtterance(text);
  text_speak.rate = 0.9;      // Slightly slower for a smooth tone
  text_speak.pitch = 0.8;     // Lower pitch for sultry effect
  text_speak.volume = 1;      // Max volume for clarity

  const voices = window.speechSynthesis.getVoices();
  text_speak.voice = voices.find(voice =>
    voice.name.toLowerCase().includes("zira") ||
    voice.name.toLowerCase().includes("samantha") ||
    voice.name.toLowerCase().includes("female") ||
    voice.name.toLowerCase().includes("google us english")
  );

  window.speechSynthesis.speak(text_speak);
}

window.speechSynthesis.onvoiceschanged = () => {
  // Voices ready
};

// Greet the user based on the time of day
function wishMe() {
  const day = new Date();
  const hours = day.getHours();
  if (hours >= 0 && hours < 12) {
    speak("Good Morning, Sir.");
  } else if (hours >= 12 && hours < 16) {
    speak("Good Afternoon, Sir.");
  } else {
    speak("Good Evening, Sir.");
  }
}

window.addEventListener("load", () => {
  wishMe();
});

let speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = new speechRecognition();

// Handle speech recognition results
recognition.onresult = (event) => {
  let currentIndex = event.resultIndex;
  let transcript = event.results[currentIndex][0].transcript;
  content.innerText = transcript;
  takeCommand(transcript.toLowerCase());
};

// Start listening on button click
btn.addEventListener("click", () => {
  recognition.start();
  btn.style.display = "none";
  voice.style.display = "block";
});

// Main command handler
async function takeCommand(message) {
  btn.style.display = "flex";
  voice.style.display = "none";

  if (message.includes("ask gemini")) {
    const question = message.replace("ask gemini", "").trim();
    const response = await callGemini(question);
    speak(response);
  } else {
    if (message.includes("hello") || message.includes("hey")) {
      speak("Hello, handsome. What can I do for you?");
    } else if (message.includes("who are you")) {
      speak("I'm Eva, your elegant assistant created by Mayur.");
    } else if (message.includes("how are you")) {
      speak("I'm feeling amazing. Thank you for asking.");
    } else if (message.includes("tell yourself")) {
      speak("Jai Shree Ram.");
      
    } 
    else if (message.includes("who are you") || message.includes("what is your name")) {
      speak("I'm Eva, your elegant assistant, created by Mayur... Just say the word, and I'm here for you.");
    }
    
    else if (message.includes("Eva open youtube")) {
      speak("Let me take you to YouTube.");
      window.open("https://www.youtube.com/", "_blank");
    } else if (message.includes("open google")) {
      speak("Opening Google, just for you.");
      window.open("https://www.google.com/", "_blank");
    } else if (message.includes("open instagram")) {
      speak("Here’s your Instagram.");
      window.open("https://www.instagram.com/", "_blank");
    } else if (message.includes("open linkedin")) {
      speak("Time to get professional. Opening LinkedIn.");
      window.open("https://www.linkedin.com/", "_blank");
    } else if (message.includes("open github")) {
      speak("Let’s dive into the code. Opening GitHub.");
      window.open("https://www.github.com/", "_blank");
    } else if (message.includes("open twitter")) {
      speak("Let’s see what’s trending. Opening Twitter.");
      window.open("https://www.twitter.com/", "_blank");
    } else if (message.includes("open spotify")) {
      speak("Here’s your vibe station. Opening Spotify.");
      window.open("https://www.spotify.com/", "_blank");
    } else {
      speak(`Let me look that up for you.`);
      window.open(`https://www.google.com/search?q=${message}`);
    }
  }
}

// Gemini API call
async function callGemini(prompt) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`;

  const requestBody = {
    prompt: { text: prompt },
    temperature: 0.7,
    maxTokens: 300
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error("API Error:", errorMessage);
      return `Error: ${errorMessage}`;
    }

    const data = await response.json();
    console.log("API Response:", data);

    return data.candidates?.[0]?.output || "No valid response from Gemini.";
  } catch (error) {
    console.error("Network Error:", error);
    return "Failed to connect to Gemini API.";
  }
}
