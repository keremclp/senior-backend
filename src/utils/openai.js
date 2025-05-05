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
const matchingFieldsFromResume = async (resumeAnalysis) => {
  try {
    const advisors = await Advisor.find({}, 'tags');
    const allowedTags = [...new Set(advisors.flatMap(advisor => advisor.tags))];
    console.log('Allowed tags:', allowedTags);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert system that matches resume content to academic and technical fields. Your task is to identify relevant fields from a provided list that match a student's resume. Be thorough but reasonable in your matching criteria.`
        },
        {
          role: "user",
          content: `Analyze this resume data and identify which academic/technical fields from the provided list best match the student's profile.
        
          INSTRUCTIONS:
          1. ONLY select fields from the Turkish list provided
          2. Consider ALL relevant information: skills, education, experience, projects, courses, and keywords
          3. Use a balanced approach - match fields where there's reasonable evidence (not requiring extensive proof)
          4. Match fields even if they appear just a few times if they're significant to the student's profile
          5. Look for both direct matches AND related concepts (e.g., programming skills should match "Yazılım Geliştirme")
          6. Be comprehensive - it's better to include slightly relevant fields than to miss important matches
          
          TURKISH FIELD LIST: ${JSON.stringify(allowedTags)}
          
          RESUME ANALYSIS: ${JSON.stringify(resumeAnalysis)}
          
          Return ONLY a JSON object with this exact format:
          { "fields": ["Field1", "Field2", ...] }
          
          IMPORTANT: Return ALL relevant fields from the provided list, even if you're only moderately confident about the match.`
        }
      ],
      response_format: { type: "json_object" }
    });
    console.log('OpenAI response:', response.choices[0].message.content);

    const relevantFields = JSON.parse(response.choices[0].message.content);

    let fieldsArray = Array.isArray(relevantFields.fields)
      ? relevantFields.fields
      : [];

    console.log('Fields array for matching (in Turkish):', fieldsArray);

    return { fields: fieldsArray };

  } catch (error) {
    console.error('Error matching advisors:', error);
    throw new CustomError.BadRequestError(`Advisor matching failed: ${error.message}`);
  }
};


module.exports = {
  analyzeResume,
  matchingFieldsFromResume
};