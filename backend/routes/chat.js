const express = require('express');
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const router = express.Router();

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const HF_MODEL = 'deepseek-r1:7b';

// Set up file upload storage (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Route to handle text-based chat
router.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const response = await axios.post(
            OLLAMA_URL,
            {
                model: HF_MODEL,
                prompt: `chat : ${message}`,
                stream: false,
                options: { num_gpu_layers: 100 }  // Pushes layers to GPU
            },
            { timeout: 60000 }
        );

        if (response.data && response.data.response) {
            res.json({ reply: response.data.response.trim() });
        } else {
            res.status(500).json({ error: 'Invalid response from Ollama API' });
        }
    } catch (error) {
        console.error('Ollama API Error:', error.message);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Route to handle PDF summarization
router.post('/summarize-pdf', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'PDF file is required' });
    }

    try {
        // Extract text from the PDF
        const pdfText = await pdfParse(req.file.buffer);
        const extractedText = pdfText.text.substring(0, 5000); // Limit to 5000 chars (to avoid large prompts)

        // Send extracted text to Ollama for summarization
        const response = await axios.post(
            OLLAMA_URL,
            {
                model: HF_MODEL,
                prompt: `Summarize this document briefly in 3 sentences, focusing only on key points:\n\n${extractedText}`,
                stream: false,
                options: { num_gpu_layers: 400 }  // Pushes layers to GPU
            },
            { timeout: 120000 }
        );
        

        if (response.data && response.data.response) {
            res.json({ summary: response.data.response.trim() });
        } else {
            res.status(500).json({ error: 'Invalid response from Ollama API' });
        }
    } catch (error) {
        console.error('Error processing PDF:', error.message);
        res.status(500).json({ error: 'Failed to summarize PDF' });
    }
});

module.exports = router;
