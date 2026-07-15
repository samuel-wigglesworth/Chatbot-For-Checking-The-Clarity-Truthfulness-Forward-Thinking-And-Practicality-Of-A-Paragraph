// Configuration
const CONFIG = {
    // Using Cloudflare Workers AI endpoint (will be replaced with /api/evaluate in production)
    API_ENDPOINT: '/api/evaluate',
    MODEL: 'llama3.1:latest',
    MAX_CHARS: 5000,
    TIMEOUT_MS: 30000
};

// DOM Elements
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const evaluateBtn = document.getElementById('evaluateBtn');
const resultsSection = document.getElementById('resultsSection');
const errorMessage = document.getElementById('errorMessage');

// Score Elements
const scoreElements = {
    clarity: {
        value: document.getElementById('clarityScore'),
        bar: document.getElementById('clarityBar')
    },
    truthfulness: {
        value: document.getElementById('truthfulnessScore'),
        bar: document.getElementById('truthfulnessBar')
    },
    innovation: {
        value: document.getElementById('innovationScore'),
        bar: document.getElementById('innovationBar')
    },
    practicality: {
        value: document.getElementById('practicalityScore'),
        bar: document.getElementById('practicalityBar')
    }
};

// Event Listeners
textInput.addEventListener('input', updateCharCount);
evaluateBtn.addEventListener('click', handleEvaluate);

// Update character count
function updateCharCount() {
    const length = textInput.value.length;
    charCount.textContent = `${length} / ${CONFIG.MAX_CHARS}`;
    
    if (length > CONFIG.MAX_CHARS * 0.9) {
        charCount.style.color = '#ef4444';
    } else {
        charCount.style.color = '#64748b';
    }
}

// Handle evaluate button click
async function handleEvaluate() {
    const text = textInput.value.trim();
    
    // Validation
    if (!text) {
        showError('Please enter some text to evaluate.');
        return;
    }
    
    if (text.length < 10) {
        showError('Please enter at least 10 characters for meaningful evaluation.');
        return;
    }
    
    // Reset UI
    hideError();
    setLoading(true);
    resetScores();
    resultsSection.style.display = 'block';
    
    try {
        // Evaluate all dimensions using single model
        const results = await evaluateAllDimensions(text);
        
        // Update all scores
        updateScore('clarity', results.clarity);
        updateScore('truthfulness', results.truthfulness);
        updateScore('innovation', results.innovation);
        updateScore('practicality', results.practicality);
        
    } catch (error) {
        showError(`Evaluation failed: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

// Evaluate all dimensions using llama3.1
async function evaluateAllDimensions(text) {
    const prompt = `Evaluate the following text across four dimensions and provide ONLY a JSON response with scores from 0 to 100 for each dimension. No explanations, no additional text, just valid JSON.

Text to evaluate: "${text}"

Dimensions:
1. Clarity - How clear, concise, and well-organized is the text?
2. Truthfulness - How factually accurate and logically consistent is the content?
3. Innovation - How novel, creative, and forward-thinking are the ideas?
4. Practicality - How actionable, realistic, and useful is the content?

Respond with ONLY this JSON format:
{
  "clarity": <score 0-100>,
  "truthfulness": <score 0-100>,
  "innovation": <score 0-100>,
  "practicality": <score 0-100>
}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
        
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                prompt: prompt
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate scores
        const validatedScores = {
            clarity: clampScore(data.clarity),
            truthfulness: clampScore(data.truthfulness),
            innovation: clampScore(data.innovation),
            practicality: clampScore(data.practicality)
        };
        
        return validatedScores;
        
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Evaluation timed out after 30 seconds');
        }
        throw new Error(`Failed to evaluate: ${error.message}`);
    }
}

// Clamp score between 0 and 100
function clampScore(score) {
    const num = parseInt(score) || 0;
    return Math.max(0, Math.min(100, num));
}

// Update score display
function updateScore(dimension, score, error = null) {
    const elements = scoreElements[dimension];
    
    if (error) {
        elements.value.textContent = 'Error';
        elements.value.classList.add('error');
        elements.bar.style.width = '0%';
        return;
    }
    
    elements.value.classList.remove('error');
    elements.value.textContent = score;
    
    // Animate bar
    setTimeout(() => {
        elements.bar.style.width = `${score}%`;
        
        // Color code based on score
        elements.bar.classList.remove('high', 'medium', 'low');
        if (score >= 70) {
            elements.bar.classList.add('high');
        } else if (score >= 40) {
            elements.bar.classList.add('medium');
        } else {
            elements.bar.classList.add('low');
        }
    }, 100);
}

// Reset all scores
function resetScores() {
    Object.keys(scoreElements).forEach(dimension => {
        scoreElements[dimension].value.textContent = '--';
        scoreElements[dimension].value.classList.remove('error');
        scoreElements[dimension].bar.style.width = '0%';
        scoreElements[dimension].bar.classList.remove('high', 'medium', 'low');
    });
}

// Set loading state
function setLoading(isLoading) {
    const btnText = evaluateBtn.querySelector('.btn-text');
    const btnLoader = evaluateBtn.querySelector('.btn-loader');
    
    if (isLoading) {
        evaluateBtn.disabled = true;
        btnText.textContent = 'Evaluating...';
        btnLoader.style.display = 'inline-block';
    } else {
        evaluateBtn.disabled = false;
        btnText.textContent = 'Evaluate Text';
        btnLoader.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Check API connection on load
async function checkAPIConnection() {
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET'
        });
        if (!response.ok) {
            console.warn('API endpoint is not responding properly');
        }
    } catch (error) {
        console.warn('Cannot connect to API endpoint');
    }
}

// Initialize
checkAPIConnection();
