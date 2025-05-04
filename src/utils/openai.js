const { OpenAI } = require('openai');
const CustomError = require('../errors');
const fs = require('fs');
const { downloadFileFromS3 } = require('./s3');
const Advisor = require('../models/advisor.model');  // Import the new function

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyzes a resume and extracts key information
 * @param {string} fileUrl - The URL of the resume file in S3
 * @returns {Promise<Object>} - Resume analysis results
 */
const analyzeResume = async (fileUrl) => {
  let tempFilePath = null;
  
  try {
    // Download file from S3 to a temporary location
    tempFilePath = await downloadFileFromS3(fileUrl);
    console.log('File downloaded to:', tempFilePath);
    
    // Create a file pointer to the resume in OpenAI using the local file
    const file = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: 'assistants',
    });

    console.log('File uploaded to OpenAI:', file.id);

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add a message to the thread asking for resume analysis
    await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: [{
          type: 'text',
          text: 'Please analyze this resume and extract the following information: skills, education, experience, projects, and main areas of expertise. The resume may be in Turkish or English - please process it in the language it is written in. Return only the raw JSON object without any markdown formatting, explanation, or code blocks.'
        }]
      });
    
    console.log('Message sent to thread:', thread.id);
      
      // Then add the file attachment separately
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: [{
          type: 'text',
          text: 'Here is the resume file to analyze:'
        }],
        attachments: [{ 
          file_id: file.id, 
          tools: [{ type: "file_search" }]  // Correct format: array of objects with type property
        }]
      });
    console.log('File attached to thread:', file.id);
    // Run the assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
    });

    console.log('Run created:', run.id);

    // Rest of your code remains the same...
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    console.log('Run status:', runStatus.status);
    
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'failed') {
        throw new Error('Resume analysis failed');
      }
    }

    console.log('Run completed:', runStatus.status);

    // Get the messages from the thread
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    console.log('Messages retrieved:', messages.data.length);
    // Parse the result
    const analysisMessage = messages.data.find(msg => msg.role === 'assistant');
    const analysisText = analysisMessage.content[0].text.value

    console.log('Analysis result:', analysisText);
    
    // Clean up the temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    
    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    
    // Clean up the temporary file in case of error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    throw new CustomError.BadRequestError(`Resume analysis failed: ${error.message}`);
  }
};


/**
 * Matches a resume analysis with advisors
 * @param {Object} resumeAnalysis - The analysis of the resume
 * @returns {Promise<Array>} - Matching advisors with scores
 */
const matchAdvisorsWithResume = async (resumeAnalysis) => {
  try {
    // Extract relevant fields from resume using OpenAI and translate to Turkish
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a matching system that helps find advisors for students based on their resume. You MUST return results in Turkish language since advisor tags in database are stored in Turkish."
          },
          {
            role: "user",
            content: `Find the most relevant fields of study based on this resume analysis: ${JSON.stringify(resumeAnalysis)}. 
            IMPORTANT: Return field names in TURKISH language only, as our advisor tags database only contains Turkish terms.
            For example, instead of "Artificial Intelligence", use "Yapay Zeka".
            Return a JSON object with a single 'fields' property containing an array of relevant fields and technologies in Turkish.`
          }
        ],
        response_format: { type: "json_object" }
      });

    const relevantFields = JSON.parse(response.choices[0].message.content);
    
    // Same processing logic as before
    let fieldsArray = [];
    
    if (relevantFields.fields) {
      fieldsArray = relevantFields.fields;
    } else if (relevantFields.fields_of_study || relevantFields.technologies) {
      fieldsArray = [
        ...(relevantFields.fields_of_study || []),
        ...(relevantFields.technologies || [])
      ];
    } else {
      fieldsArray = Object.values(relevantFields).flat().filter(item => typeof item === 'string');
    }
    
    console.log('Fields array for matching (in Turkish):', fieldsArray);
    
    return { fields: fieldsArray };
    
  } catch (error) {
    console.error('Error matching advisors:', error);
    throw new CustomError.BadRequestError(`Advisor matching failed: ${error.message}`);
  }
};

module.exports = {
  analyzeResume,
  matchAdvisorsWithResume
};