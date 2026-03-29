const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Document = require('../models/Document');

function canAccessDocument(document, userId) {
    const isOwner = document.ownerId.toString() === userId;
    const isCollaborator = document.collaborators.some((collaborator) => collaborator.toString() === userId);
    return isOwner || isCollaborator;
}

function ensureOpenRouterConfig() {
    if (!process.env.OPENROUTER_API_KEY) {
        const error = new Error('OPENROUTER_API_KEY is missing');
        error.status = 500;
        throw error;
    }
}

function extractModelText(content) {
    if (typeof content === 'string') {
        return content.trim();
    }

    if (Array.isArray(content)) {
        return content
            .map((item) => (typeof item === 'string' ? item : item?.text || ''))
            .join('\n')
            .trim();
    }

    return '';
}

function sendAiError(res, error) {
    const status = error.status || 500;
    const payload = {
        success: false,
        message: 'AI request failed'
    };

    if (process.env.NODE_ENV !== 'production') {
        payload.error = error.message;
    }

    return res.status(status).json(payload);
}

async function callOpenRouter(messages, temperature = 0.4) {
    ensureOpenRouterConfig();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'LiveDoc'
        },
        body: JSON.stringify({
            model: 'openrouter/free',
            temperature,
            messages
        })
    });

    if (!response.ok) {
        const body = await response.text();
        const error = new Error(`OpenRouter error (${response.status}): ${body}`);
        error.status = response.status;
        throw error;
    }

    const data = await response.json();
    const text = extractModelText(data?.choices?.[0]?.message?.content);

    if (!text) {
        const error = new Error('No content returned by AI model');
        error.status = 502;
        throw error;
    }

    return text;
}

async function getAuthorizedDocument(documentId, userId) {
    const document = await Document.findById(documentId).select('ownerId collaborators content title');

    if (!document) {
        return { status: 404, response: { success: false, message: 'Document not found' } };
    }

    if (!canAccessDocument(document, userId)) {
        return { status: 403, response: { success: false, message: 'You do not have access to this document' } };
    }

    return { document };
}

// POST /api/ai/edit-selection
router.post('/edit-selection', authMiddleware, async (req, res) => {
    try {
        const { documentId, selectedText, action, targetLanguage } = req.body;

        if (!documentId || !selectedText || !action) {
            return res.status(400).json({
                success: false,
                message: 'documentId, selectedText, and action are required'
            });
        }

        const access = await getAuthorizedDocument(documentId, req.userId);
        if (access.response) {
            return res.status(access.status).json(access.response);
        }

        const prompts = {
            rewrite: 'Rewrite the text for clarity and readability while preserving meaning.',
            summarize: 'Summarize the text concisely while preserving key points.',
            fix_grammar: 'Fix grammar, spelling, and punctuation while preserving original tone.',
            translate: `Translate the text to ${targetLanguage || 'English'} while preserving meaning.`
        };

        if (!prompts[action]) {
            return res.status(400).json({
                success: false,
                message: 'Unsupported action'
            });
        }

        const output = await callOpenRouter([
            {
                role: 'system',
                content: 'You are a writing assistant. Return only the transformed text with no preamble.'
            },
            {
                role: 'user',
                content: `${prompts[action]}\n\nText:\n${selectedText}`
            }
        ], 0.3);

        res.json({
            success: true,
            result: output
        });
    } catch (error) {
        console.error('AI edit-selection error:', error.message);
        return sendAiError(res, error);
    }
});

// POST /api/ai/generate-draft
router.post('/generate-draft', authMiddleware, async (req, res) => {
    try {
        const { documentId, prompt, mode } = req.body;

        if (!documentId || !prompt) {
            return res.status(400).json({
                success: false,
                message: 'documentId and prompt are required'
            });
        }

        const access = await getAuthorizedDocument(documentId, req.userId);
        if (access.response) {
            return res.status(access.status).json(access.response);
        }

        const instruction = mode === 'outline'
            ? 'Generate a structured outline with headings and concise bullet points.'
            : 'Generate a complete first draft with clear sections and practical details.';

        const output = await callOpenRouter([
            {
                role: 'system',
                content: 'You are a professional writing assistant for collaborative documents.'
            },
            {
                role: 'user',
                content: `${instruction}\n\nPrompt:\n${prompt}`
            }
        ], 0.6);

        res.json({
            success: true,
            result: output
        });
    } catch (error) {
        console.error('AI generate-draft error:', error.message);
        return sendAiError(res, error);
    }
});

// POST /api/ai/ask-document
router.post('/ask-document', authMiddleware, async (req, res) => {
    try {
        const { documentId, question } = req.body;

        if (!documentId || !question) {
            return res.status(400).json({
                success: false,
                message: 'documentId and question are required'
            });
        }

        const access = await getAuthorizedDocument(documentId, req.userId);
        if (access.response) {
            return res.status(access.status).json(access.response);
        }

        const documentText = access.document.content || '';
        const output = await callOpenRouter([
            {
                role: 'system',
                content: 'Answer questions strictly based on the provided document context. If missing, state that clearly.'
            },
            {
                role: 'user',
                content: `Document title: ${access.document.title}\n\nDocument content:\n${documentText}\n\nQuestion:\n${question}`
            }
        ], 0.2);

        res.json({
            success: true,
            answer: output
        });
    } catch (error) {
        console.error('AI ask-document error:', error.message);
        return sendAiError(res, error);
    }
});

module.exports = router;
