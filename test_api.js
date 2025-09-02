const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';

// Test functions
async function testHealthCheck() {
    try {
        const response = await axios.get(`${API_BASE}/health`);
        console.log('✅ Health check passed:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

async function testChatInit() {
    try {
        const response = await axios.post(`${API_BASE}/chat/init`);
        console.log('✅ Chat init passed:', response.data);
        return response.data.sessionId;
    } catch (error) {
        console.error('❌ Chat init failed:', error.message);
        return null;
    }
}

async function testChatMessage(sessionId, message) {
    try {
        const response = await axios.post(`${API_BASE}/chat/message`, {
            sessionId,
            message
        });
        console.log('✅ Chat message passed:', {
            response: response.data.response.substring(0, 100) + '...',
            sessionId: response.data.sessionId
        });
        return true;
    } catch (error) {
        console.error('❌ Chat message failed:', error.message);
        return false;
    }
}

async function testChatHistory(sessionId) {
    try {
        const response = await axios.get(`${API_BASE}/chat/history/${sessionId}`);
        console.log('✅ Chat history passed:', {
            messageCount: response.data.messages.length
        });
        return true;
    } catch (error) {
        console.error('❌ Chat history failed:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 Starting API tests...\n');
    
    const healthOK = await testHealthCheck();
    if (!healthOK) {
        console.log('\n❌ Basic health check failed. Make sure server is running.');
        return;
    }
    
    console.log();
    const sessionId = await testChatInit();
    if (!sessionId) {
        console.log('\n❌ Cannot continue without session ID.');
        return;
    }
    
    console.log();
    const messageOK = await testChatMessage(sessionId, 'Hello, what services do you offer?');
    if (!messageOK) {
        console.log('\n❌ Message test failed.');
        return;
    }
    
    console.log();
    const historyOK = await testChatHistory(sessionId);
    
    console.log('\n🎉 All tests completed!');
    console.log(`✅ Health: ${healthOK ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Init: ${sessionId ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Message: ${messageOK ? 'PASS' : 'FAIL'}`);
    console.log(`✅ History: ${historyOK ? 'PASS' : 'FAIL'}`);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    runAllTests();
} else {
    const command = args[0];
    switch (command) {
        case 'health':
            testHealthCheck();
            break;
        case 'init':
            testChatInit();
            break;
        case 'message':
            if (args[1] && args[2]) {
                testChatMessage(args[1], args[2]);
            } else {
                console.log('Usage: node test-api.js message <sessionId> <message>');
            }
            break;
        case 'history':
            if (args[1]) {
                testChatHistory(args[1]);
            } else {
                console.log('Usage: node test-api.js history <sessionId>');
            }
            break;
        default:
            console.log('Available commands:');
            console.log('  node test-api.js          - Run all tests');
            console.log('  node test-api.js health   - Test health endpoint');
            console.log('  node test-api.js init     - Test chat initialization');
            console.log('  node test-api.js message <sessionId> <message> - Test message sending');
            console.log('  node test-api.js history <sessionId> - Test history retrieval');
    }
}